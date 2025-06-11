import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Calendar, DollarSign, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';

type InsuranceTrackerProps = {
  assetId: string;
};

type InsuranceData = {
  id?: string;
  is_insured: boolean;
  insurance_provider?: string;
  policy_number?: string;
  coverage_amount?: number;
  premium_amount?: number;
  renewal_date?: string;
};

export default function InsuranceTracker({ assetId }: InsuranceTrackerProps) {
  const { user } = useAuth();
  const [insurance, setInsurance] = useState<InsuranceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<InsuranceData>({
    is_insured: false,
    insurance_provider: '',
    policy_number: '',
    coverage_amount: 0,
    premium_amount: 0,
    renewal_date: '',
  });

  useEffect(() => {
    fetchInsuranceData();
  }, [assetId]);

  const fetchInsuranceData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('asset_insurance')
        .select('*')
        .eq('asset_id', assetId)
        .eq('owner_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setInsurance(data);
        setFormData(data);
      } else {
        // No insurance record exists yet
        setInsurance(null);
      }
    } catch (error) {
      console.error('Error fetching insurance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const insuranceData = {
        asset_id: assetId,
        owner_id: user?.id,
        is_insured: formData.is_insured,
        insurance_provider: formData.insurance_provider || null,
        policy_number: formData.policy_number || null,
        coverage_amount: formData.coverage_amount || null,
        premium_amount: formData.premium_amount || null,
        renewal_date: formData.renewal_date || null,
      };

      if (insurance?.id) {
        // Update existing record
        const { error } = await supabase
          .from('asset_insurance')
          .update(insuranceData)
          .eq('id', insurance.id);

        if (error) throw error;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('asset_insurance')
          .insert([insuranceData])
          .select()
          .single();

        if (error) throw error;
        setInsurance(data);
      }

      setEditing(false);
      await fetchInsuranceData();
    } catch (error) {
      console.error('Error saving insurance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRenewalSoon = () => {
    if (!insurance?.renewal_date) return false;
    const renewalDate = new Date(insurance.renewal_date);
    const today = new Date();
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilRenewal <= 30 && daysUntilRenewal >= 0;
  };

  const isExpired = () => {
    if (!insurance?.renewal_date) return false;
    const renewalDate = new Date(insurance.renewal_date);
    const today = new Date();
    return renewalDate < today;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-slate-200 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-slate-900">Insurance Information</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {insurance?.is_insured && (
            <Badge 
              variant={isExpired() ? 'destructive' : isRenewalSoon() ? 'warning' : 'success'}
            >
              {isExpired() ? 'Expired' : isRenewalSoon() ? 'Renewal Due' : 'Insured'}
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : insurance ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editing ? '' : insurance ? '' : 'Add Insurance'}
          </Button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_insured"
              name="is_insured"
              checked={formData.is_insured}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <label htmlFor="is_insured" className="ml-2 block text-sm text-slate-700">
              This asset is insured
            </label>
          </div>

          {formData.is_insured && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="insurance_provider" className="block text-sm font-medium text-slate-700">
                  Insurance Provider
                </label>
                <Input
                  type="text"
                  id="insurance_provider"
                  name="insurance_provider"
                  value={formData.insurance_provider || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="policy_number" className="block text-sm font-medium text-slate-700">
                  Policy Number
                </label>
                <Input
                  type="text"
                  id="policy_number"
                  name="policy_number"
                  value={formData.policy_number || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="coverage_amount" className="block text-sm font-medium text-slate-700">
                  Coverage Amount (ZAR)
                </label>
                <Input
                  type="number"
                  id="coverage_amount"
                  name="coverage_amount"
                  min="0"
                  step="0.01"
                  value={formData.coverage_amount || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="premium_amount" className="block text-sm font-medium text-slate-700">
                  Premium Amount (ZAR)
                </label>
                <Input
                  type="number"
                  id="premium_amount"
                  name="premium_amount"
                  min="0"
                  step="0.01"
                  value={formData.premium_amount || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="renewal_date" className="block text-sm font-medium text-slate-700">
                  Renewal Date
                </label>
                <Input
                  type="date"
                  id="renewal_date"
                  name="renewal_date"
                  value={formData.renewal_date || ''}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Insurance Info'}
            </Button>
          </div>
        </form>
      ) : (
        <div>
          {insurance?.is_insured ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Status</p>
                    <p className="text-sm text-green-600">Insured</p>
                  </div>
                </div>

                {insurance.insurance_provider && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-slate-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Provider</p>
                      <p className="text-sm text-slate-900">{insurance.insurance_provider}</p>
                    </div>
                  </div>
                )}

                {insurance.policy_number && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-slate-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Policy Number</p>
                      <p className="text-sm text-slate-900">{insurance.policy_number}</p>
                    </div>
                  </div>
                )}

                {insurance.coverage_amount && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-slate-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Coverage</p>
                      <p className="text-sm text-slate-900">
                        R {insurance.coverage_amount != null ? insurance.coverage_amount.toLocaleString() : 'Not specified'}
                      </p>
                    </div>
                  </div>
                )}

                {insurance.premium_amount && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-slate-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Premium</p>
                      <p className="text-sm text-slate-900">
                        R {insurance.premium_amount != null ? insurance.premium_amount.toLocaleString() : 'Not specified'}
                      </p>
                    </div>
                  </div>
                )}

                {insurance.renewal_date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Renewal Date</p>
                      <p className={`text-sm ${isExpired() ? 'text-red-600' : isRenewalSoon() ? 'text-amber-600' : 'text-slate-900'}`}>
                        {formatDate(insurance.renewal_date)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {(isRenewalSoon() || isExpired()) && (
                <div className={`p-3 rounded-md ${isExpired() ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                  <p className="text-sm font-medium">
                    {isExpired() ? 'Insurance Expired' : 'Renewal Due Soon'}
                  </p>
                  <p className="text-sm">
                    {isExpired() 
                      ? 'Your insurance policy has expired. Please renew to maintain coverage.'
                      : 'Your insurance policy expires soon. Consider renewing to avoid coverage gaps.'
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">No insurance information available</p>
              <p className="text-sm text-slate-400">Add insurance details to track coverage and renewals</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}