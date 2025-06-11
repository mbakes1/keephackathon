import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase/supabase';
import { useAuth } from '../../context/AuthContext';

type Asset = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  serial_number: string | null;
  vin_identifier: string | null;
  purchase_date: string | null;
  value: number | null;
  asset_value_zar: number | null;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  asset_location: string | null;
  asset_condition: string | null;
  created_at: string;
};

type AssetFilterProps = {
  categories: string[];
  statuses: string[];
  conditions: string[];
  onFilterChange: (filters: any) => void;
};

function AssetFilters({ categories, statuses, conditions, onFilterChange }: AssetFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');

  const handleFilterChange = () => {
    onFilterChange({ 
      category: selectedCategory, 
      status: selectedStatus,
      condition: selectedCondition 
    });
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedCategory, selectedStatus, selectedCondition]);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-48">
        <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
          Category
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      <div className="w-full sm:w-48">
        <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      <div className="w-full sm:w-48">
        <label htmlFor="condition" className="block text-sm font-medium text-slate-700 mb-1">
          Condition
        </label>
        <select
          id="condition"
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value)}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Conditions</option>
          {conditions.map((condition) => (
            <option key={condition} value={condition}>
              {condition.charAt(0).toUpperCase() + condition.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function AssetsTable() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({ category: '', status: '', condition: '' });

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('owner_id', user?.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          setAssets(data);
          setFilteredAssets(data);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(data.map(asset => asset.category))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      fetchAssets();
    }
  }, [user?.id]);

  useEffect(() => {
    // Apply filters and search
    let result = assets;
    
    if (searchQuery) {
      result = result.filter(
        asset =>
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.vin_identifier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.asset_location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filters.category) {
      result = result.filter(asset => asset.category === filters.category);
    }
    
    if (filters.status) {
      result = result.filter(asset => asset.status === filters.status);
    }
    
    if (filters.condition) {
      result = result.filter(asset => asset.asset_condition === filters.condition);
    }
    
    setFilteredAssets(result);
  }, [searchQuery, filters, assets]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const statuses = ['available', 'assigned', 'maintenance', 'retired'];
  const conditions = ['excellent', 'good', 'fair', 'poor'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 w-full"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>
      
      {showFilters && (
        <div className="bg-white p-4 rounded-md shadow">
          <AssetFilters
            categories={categories}
            statuses={statuses}
            conditions={conditions}
            onFilterChange={handleFilterChange}
          />
        </div>
      )}
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
            <p className="mt-2 text-sm text-slate-500">Loading assets...</p>
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Asset Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Category & Condition
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Identifiers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Value & Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Location & Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <Link 
                          to={`/assets/${asset.id}`}
                          className="font-medium text-blue-600 hover:text-blue-900 block"
                        >
                          {asset.name}
                        </Link>
                        {asset.description && (
                          <p className="text-sm text-slate-500 mt-1 truncate max-w-xs">
                            {asset.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-900">{asset.category}</p>
                        {asset.asset_condition && (
                          <Badge 
                            variant={
                              asset.asset_condition === 'excellent' ? 'success' :
                              asset.asset_condition === 'good' ? 'default' :
                              asset.asset_condition === 'fair' ? 'warning' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {asset.asset_condition.charAt(0).toUpperCase() + asset.asset_condition.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm text-slate-500">
                        {asset.serial_number && (
                          <p>SN: {asset.serial_number}</p>
                        )}
                        {asset.vin_identifier && (
                          <p>VIN: {asset.vin_identifier}</p>
                        )}
                        {!asset.serial_number && !asset.vin_identifier && (
                          <p>-</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {asset.asset_value_zar && (
                          <div className="flex items-center text-sm text-slate-900">
                            <DollarSign className="h-3 w-3 mr-1" />
                            R {asset.asset_value_zar.toLocaleString()}
                          </div>
                        )}
                        {asset.purchase_date && (
                          <div className="flex items-center text-sm text-slate-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(asset.purchase_date)}
                          </div>
                        )}
                        {!asset.asset_value_zar && !asset.purchase_date && (
                          <p className="text-sm text-slate-500">-</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {asset.asset_location && (
                          <div className="flex items-center text-sm text-slate-500">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate max-w-xs">{asset.asset_location}</span>
                          </div>
                        )}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-slate-500">No assets found</p>
            <Link to="/assets/new" className="mt-2 inline-block text-blue-600 hover:text-blue-500">
              Add your first asset
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}