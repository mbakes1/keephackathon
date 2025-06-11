import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Package, PlusCircle, AlertTriangle, ArrowUpCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase/supabase';
import { formatCurrency } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    assignedAssets: 0,
    maintenanceAssets: 0,
    totalValue: 0,
  });
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch asset stats
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('*');
          
        if (assetsError) throw assetsError;
        
        if (assets) {
          const assigned = assets.filter(a => a.status === 'assigned').length;
          const maintenance = assets.filter(a => a.status === 'maintenance').length;
          const totalValue = assets.reduce((sum, asset) => sum + (asset.asset_value_zar || 0), 0);
          
          setStats({
            totalAssets: assets.length,
            assignedAssets: assigned,
            maintenanceAssets: maintenance,
            totalValue,
          });
        }
        
        // Fetch recent assets
        const { data: recent, error: recentError } = await supabase
          .from('assets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (recentError) throw recentError;
        
        if (recent) {
          setRecentAssets(recent);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const statItems = [
    {
      name: 'Total Assets',
      value: stats.totalAssets,
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Assigned Assets',
      value: stats.assignedAssets,
      icon: ArrowUpCircle,
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      name: 'In Maintenance',
      value: stats.maintenanceAssets,
      icon: AlertTriangle,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      name: 'Total Value',
      value: formatCurrency(stats.totalValue),
      icon: BarChart3,
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of your organization's assets</p>
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
      
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg transition-all hover:shadow-md"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">{item.name}</dt>
                    <dd>
                      <div className="text-lg font-semibold text-slate-900">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Assets */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
          <h3 className="text-lg font-medium leading-6 text-slate-900">Recently Added Assets</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
              <p className="mt-2 text-sm text-slate-500">Loading recent assets...</p>
            </div>
          ) : recentAssets.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {recentAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-900">
                        {asset.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {asset.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${asset.status === 'available' ? 'bg-green-100 text-green-800' : ''}
                        ${asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' : ''}
                        ${asset.status === 'maintenance' ? 'bg-amber-100 text-amber-800' : ''}
                        ${asset.status === 'retired' ? 'bg-slate-100 text-slate-800' : ''}`}
                      >
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {asset.asset_value_zar ? formatCurrency(asset.asset_value_zar) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <p className="text-slate-500">No assets added yet</p>
              <Link to="/assets/new" className="mt-2 inline-block text-blue-600 hover:text-blue-500">
                Add your first asset
              </Link>
            </div>
          )}
        </div>
        {recentAssets.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-4 sm:px-6">
            <Link
              to="/assets"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all assets
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}