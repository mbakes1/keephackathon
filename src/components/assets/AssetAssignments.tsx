import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Calendar, User, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';

type AssetAssignmentsProps = {
  assetId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
};

type Assignment = {
  id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_date: string;
  due_date: string | null;
  return_date: string | null;
  return_condition: string | null;
  assigned_to_profile?: {
    full_name: string;
    email: string;
  };
  assigned_by_profile?: {
    full_name: string;
    email: string;
  };
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
};

export default function AssetAssignments({ assetId, currentStatus, onStatusChange }: AssetAssignmentsProps) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    assigned_to: '',
    due_date: '',
    return_condition: '',
  });

  useEffect(() => {
    fetchAssignments();
    fetchProfiles();
  }, [assetId]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('asset_assignments')
        .select(`
          *,
          assigned_to_profile:assigned_to(full_name, email),
          assigned_by_profile:assigned_by(full_name, email)
        `)
        .eq('asset_id', assetId)
        .order('assigned_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;

      if (data) {
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assignmentData = {
        asset_id: assetId,
        assigned_to: formData.assigned_to,
        assigned_by: user?.id,
        assigned_date: new Date().toISOString(),
        due_date: formData.due_date || null,
      };

      const { error: assignmentError } = await supabase
        .from('asset_assignments')
        .insert([assignmentData]);

      if (assignmentError) throw assignmentError;

      // Update asset status to 'assigned'
      const { error: statusError } = await supabase
        .from('assets')
        .update({ status: 'assigned' })
        .eq('id', assetId)
        .eq('owner_id', user?.id);

      if (statusError) throw statusError;

      // Reset form and refresh data
      setFormData({
        assigned_to: '',
        due_date: '',
        return_condition: '',
      });
      setShowAssignForm(false);
      onStatusChange('assigned');
      await fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (assignmentId: string) => {
    setLoading(true);

    try {
      const { error: returnError } = await supabase
        .from('asset_assignments')
        .update({
          return_date: new Date().toISOString(),
          return_condition: formData.return_condition || null,
        })
        .eq('id', assignmentId);

      if (returnError) throw returnError;

      // Update asset status to 'available'
      const { error: statusError } = await supabase
        .from('assets')
        .update({ status: 'available' })
        .eq('id', assetId)
        .eq('owner_id', user?.id);

      if (statusError) throw statusError;

      // Reset form and refresh data
      setFormData({
        assigned_to: '',
        due_date: '',
        return_condition: '',
      });
      setShowReturnForm(null);
      onStatusChange('available');
      await fetchAssignments();
    } catch (error) {
      console.error('Error processing return:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAssignment = () => {
    return assignments.find(a => !a.return_date);
  };

  const currentAssignment = getCurrentAssignment();

  if (loading && assignments.length === 0) {
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
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-slate-900">Asset Assignments</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {currentStatus === 'assigned' && currentAssignment && (
            <Badge variant="default">Currently Assigned</Badge>
          )}
          
          {currentStatus !== 'assigned' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignForm(!showAssignForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Assign Asset
            </Button>
          )}
        </div>
      </div>

      {/* Current Assignment */}
      {currentAssignment && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Currently Assigned To</h4>
              <div className="mt-2 flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    {currentAssignment.assigned_to_profile?.full_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-blue-700">
                    {currentAssignment.assigned_to_profile?.email}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-700">
                <p>Assigned: {formatDate(currentAssignment.assigned_date)}</p>
                {currentAssignment.due_date && (
                  <p>Due: {formatDate(currentAssignment.due_date)}</p>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReturnForm(currentAssignment.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark as Returned
            </Button>
          </div>
        </div>
      )}

      {/* Assignment Form */}
      {showAssignForm && (
        <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <h4 className="text-sm font-medium text-slate-900 mb-3">Assign Asset</h4>
          
          <form onSubmit={handleAssign} className="space-y-3">
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-slate-700 mb-1">
                Assign To
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                required
                value={formData.assigned_to}
                onChange={handleInputChange}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a person</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name} ({profile.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 mb-1">
                Due Date (Optional)
              </label>
              <Input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAssignForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Asset'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Return Form */}
      {showReturnForm && (
        <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <h4 className="text-sm font-medium text-slate-900 mb-3">Return Asset</h4>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="return_condition" className="block text-sm font-medium text-slate-700 mb-1">
                Return Condition (Optional)
              </label>
              <textarea
                id="return_condition"
                name="return_condition"
                rows={3}
                value={formData.return_condition}
                onChange={handleInputChange}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Describe the condition of the asset upon return..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowReturnForm(null)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                size="sm" 
                disabled={loading}
                onClick={() => handleReturn(showReturnForm)}
              >
                {loading ? 'Processing...' : 'Confirm Return'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment History */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Assignment History</h4>
        
        {assignments.length > 0 ? (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {assignment.assigned_to_profile?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {assignment.assigned_to_profile?.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(assignment.assigned_date)}
                    </div>
                    {assignment.due_date && (
                      <div className="text-xs text-slate-500">
                        Due: {formatDate(assignment.due_date)}
                      </div>
                    )}
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  
                  <div className="text-right">
                    {assignment.return_date ? (
                      <div>
                        <Badge variant="success" className="text-xs">Returned</Badge>
                        <div className="text-xs text-slate-500 mt-1">
                          {formatDate(assignment.return_date)}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No assignment history</p>
            <p className="text-sm text-slate-400">
              This asset has not been assigned to anyone yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}