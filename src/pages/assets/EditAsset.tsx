import { useParams } from 'react-router-dom';
import AssetForm from '../../components/assets/AssetForm';

export default function EditAsset() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Asset ID is required</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Asset</h1>
        <p className="text-slate-500">Update asset information</p>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <AssetForm assetId={id} />
      </div>
    </div>
  );
}