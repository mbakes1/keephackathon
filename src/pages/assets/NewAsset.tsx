import AssetForm from '../../components/assets/AssetForm';

export default function NewAsset() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Asset</h1>
        <p className="text-slate-500">Create a new asset record in your inventory</p>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <AssetForm />
      </div>
    </div>
  );
}