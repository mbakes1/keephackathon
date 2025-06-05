import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import AssetsTable from '../../components/assets/AssetsTable';

export default function AssetsList() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Inventory</h1>
          <p className="text-slate-500">Manage and track all your organization's assets</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/assets/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Asset
            </Button>
          </Link>
        </div>
      </div>
      
      <AssetsTable />
    </div>
  );
}