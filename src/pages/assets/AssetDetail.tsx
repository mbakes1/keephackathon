import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, ArrowLeft, User, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import AssetQRCode from '../../components/assets/AssetQRCode';
import InsuranceTracker from '../../components/assets/InsuranceTracker';
import AssetNotes from '../../components/assets/AssetNotes';
import { supabase } from '../../lib/supabase/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [asset, setAsset] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchAssetDetails = async () => {
      setLoading(true);
      
      try {
        // Fetch asset data
        const { data: assetData, error: assetError } = await supabase
          .from('assets')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user?.id)
          .single();
          
        if (assetError) throw assetError;
        
        if (assetData) {
          setAsset(assetData);
          
          // Fetch assignment history
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('asset_assignments')
            .select(`
              *,
              assigned_to_profile:assigned_to(full_name, email),
              assigned_by_profile:assigned_by(full_name, email)
            `)
            .eq('asset_id', id)
            .order('assigned_date', { ascending: false });
            
          if (assignmentError) throw assignmentError;
          
          if (assignmentData) {
            setAssignments(assignmentData);
          }
        }
      } catch (error) {
        console.error('Error fetching asset details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssetDetails();
  }, [id, user?.id]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      // Delete the asset
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('owner_id', user?.id);
        
      if (error) throw error;
      
      navigate('/assets');
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-medium text-slate-900">Asset not found</h2>
        <Link to="/assets" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
          Back to assets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/assets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{asset.name}</h1>
          <Badge
            variant={
              asset.status === 'available' ? 'success' :
              asset.status === 'assigned' ? 'default' :
              asset.status === 'maintenance' ? 'warning' : 'secondary'
            }
          >
            {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
          </Badge>
        </div>
        
        <div className="flex space-x-2">
          <Link to={`/assets/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          
          {!confirmDelete ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setConfirmDelete(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Details */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Asset Details</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Category</h4>
                  <p className="mt-1 text-sm text-slate-900">{asset.category}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Condition</h4>
                  <p className="mt-1 text-sm text-slate-900 capitalize">{asset.asset_condition || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Serial Number</h4>
                  <p className="mt-1 text-sm text-slate-900">{asset.serial_number || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">VIN/Identifier</h4>
                  <p className="mt-1 text-sm text-slate-900">{asset.vin_identifier || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Purchase Date</h4>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 text-slate-400 mr-1" />
                    <p className="text-sm text-slate-900">{asset.purchase_date ? formatDate(asset.purchase_date) : 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500">Value (ZAR)</h4>
                  <div className="flex items-center mt-1">
                    <DollarSign className="h-4 w-4 text-slate-400 mr-1" />
                    <p className="text-sm text-slate-900">
                      {asset.asset_value_zar ? `R ${asset.asset_value_zar.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {asset.asset_location && (
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-slate-500">Location</h4>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 text-slate-400 mr-1" />
                      <p className="text-sm text-slate-900">{asset.asset_location}</p>
                    </div>
                  </div>
                )}
                
                {asset.description && (
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-slate-500">Description</h4>
                    <p className="mt-1 text-sm text-slate-900">{asset.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Insurance Tracker */}
          <InsuranceTracker assetId={asset.id} />
          
          {/* Asset Notes */}
          <AssetNotes assetId={asset.id} />
          
          {/* Assignment History */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Assignment History</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Assigned By
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Assigned Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Return Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-slate-500" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-slate-900">
                                  {assignment.assigned_to_profile?.full_name || 'Unknown'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {assignment.assigned_to_profile?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {assignment.assigned_by_profile?.full_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {formatDate(assignment.assigned_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {assignment.return_date ? formatDate(assignment.return_date) : 'Not returned'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No assignment history found</p>
              )}
            </div>
          </div>
        </div>
        
        {/* QR Code */}
        <div className="lg:col-span-1">
          <AssetQRCode assetId={asset.id} assetName={asset.name} />
        </div>
      </div>
    </div>
  );
}