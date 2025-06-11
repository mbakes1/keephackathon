import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, ArrowLeft, User, MapPin, Calendar, DollarSign, Image, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import AssetQRCode from '../../components/assets/AssetQRCode';
import InsuranceTracker from '../../components/assets/InsuranceTracker';
import AssetNotes from '../../components/assets/AssetNotes';
import AssetAssignments from '../../components/assets/AssetAssignments';
import { supabase } from '../../lib/supabase/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';

type AssetPhoto = {
  id: string;
  photo_url: string;
  photo_description: string | null;
  is_primary: boolean | null;
};

type AssetDocument = {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string | null;
  file_size: number | null;
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [asset, setAsset] = useState<any>(null);
  const [photos, setPhotos] = useState<AssetPhoto[]>([]);
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
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
          
          // Fetch asset photos
          const { data: photoData, error: photoError } = await supabase
            .from('asset_photos')
            .select('*')
            .eq('asset_id', id)
            .eq('owner_id', user?.id)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });
            
          if (photoError) {
            console.error('Error fetching photos:', photoError);
          } else if (photoData) {
            setPhotos(photoData);
          }
          
          // Fetch asset documents
          const { data: documentData, error: documentError } = await supabase
            .from('asset_documents')
            .select('*')
            .eq('asset_id', id)
            .eq('owner_id', user?.id)
            .order('created_at', { ascending: false });
            
          if (documentError) {
            console.error('Error fetching documents:', documentError);
          } else if (documentData) {
            setDocuments(documentData);
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
      // Delete the asset (cascade will handle related records)
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

  const handleStatusChange = (newStatus: string) => {
    setAsset((prev: any) => ({ ...prev, status: newStatus }));
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

          {/* Asset Photos */}
          {photos.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                <div className="flex items-center">
                  <Image className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-slate-900">Asset Photos</h3>
                  <span className="ml-2 text-sm text-slate-500">({photos.length})</span>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                        <img
                          src={photo.photo_url}
                          alt={photo.photo_description || 'Asset photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      {photo.is_primary && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="success" className="text-xs">Primary</Badge>
                        </div>
                      )}
                      {photo.photo_description && (
                        <p className="mt-1 text-xs text-slate-500 truncate">{photo.photo_description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Asset Documents */}
          {documents.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-slate-900">Documents</h3>
                  <span className="ml-2 text-sm text-slate-500">({documents.length})</span>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-3">
                  {documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{document.document_name}</p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <span className="capitalize">{document.document_type.replace('_', ' ')}</span>
                            {document.file_size && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(document.file_size)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {document.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(document.file_url!, '_blank')}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Asset Assignments */}
          <AssetAssignments 
            assetId={asset.id} 
            currentStatus={asset.status}
            onStatusChange={handleStatusChange}
          />
          
          {/* Insurance Tracker */}
          <InsuranceTracker assetId={asset.id} />
          
          {/* Asset Notes */}
          <AssetNotes assetId={asset.id} />
        </div>
        
        {/* QR Code */}
        <div className="lg:col-span-1">
          <AssetQRCode assetId={asset.id} assetName={asset.name} />
        </div>
      </div>
    </div>
  );
}