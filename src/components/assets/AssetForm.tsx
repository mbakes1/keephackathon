import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase/supabase';
import { useAuth } from '../../context/AuthContext';

type AssetFormProps = {
  assetId?: string; // If provided, we're editing an existing asset
};

export default function AssetForm({ assetId }: AssetFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    serial_number: '',
    purchase_date: '',
    value: '',
    status: 'available',
    custom_fields: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const isEditMode = !!assetId;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .order('name');
          
        if (error) throw error;
        
        if (data) {
          setCategories(data.map(cat => cat.name));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
    
    if (isEditMode) {
      fetchAssetDetails();
    }
  }, [isEditMode, assetId]);

  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setFormData({
          name: data.name,
          category: data.category,
          description: data.description || '',
          serial_number: data.serial_number || '',
          purchase_date: data.purchase_date ? new Date(data.purchase_date).toISOString().split('T')[0] : '',
          value: data.value?.toString() || '',
          status: data.status,
          custom_fields: data.custom_fields || {},
        });
      }
    } catch (error) {
      console.error('Error fetching asset details:', error);
      setError('Error loading asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format the data for submission
      const assetData = {
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        serial_number: formData.serial_number || null,
        purchase_date: formData.purchase_date || null,
        value: formData.value ? parseFloat(formData.value) : null,
        status: formData.status,
        custom_fields: formData.custom_fields,
      };
      
      // If it's a new asset
      if (!isEditMode) {
        const { data, error } = await supabase
          .from('assets')
          .insert([assetData])
          .select();
          
        if (error) throw error;
        
        if (data && data[0]) {
          navigate(`/assets/${data[0].id}`);
        }
      } 
      // If we're updating an existing asset
      else {
        const { error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', assetId);
          
        if (error) throw error;
        
        navigate(`/assets/${assetId}`);
      }
    } catch (error: any) {
      console.error('Error saving asset:', error);
      setError(error.message || 'Error saving asset');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      // First check if the category already exists
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('name')
        .eq('name', newCategory.trim())
        .single();
        
      if (existingCategories) {
        setError('Category already exists');
        return;
      }
      
      // Add the new category
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategory.trim() }]);
        
      if (error) throw error;
      
      // Update the categories list
      setCategories(prev => [...prev, newCategory.trim()]);
      
      // Set the new category as the selected one
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      
      // Reset the new category input
      setNewCategory('');
      setShowNewCategoryInput(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-4">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Name*
          </label>
          <div className="mt-1">
            <Input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            Status*
          </label>
          <div className="mt-1">
            <select
              id="status"
              name="status"
              required
              value={formData.status}
              onChange={handleInputChange}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Category*
          </label>
          <div className="mt-1">
            {showNewCategoryInput ? (
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddCategory}>
                  Add
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewCategoryInput(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCategoryInput(true)}
                >
                  New
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="serial_number" className="block text-sm font-medium text-slate-700">
            Serial Number
          </label>
          <div className="mt-1">
            <Input
              type="text"
              name="serial_number"
              id="serial_number"
              value={formData.serial_number}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="purchase_date" className="block text-sm font-medium text-slate-700">
            Purchase Date
          </label>
          <div className="mt-1">
            <Input
              type="date"
              name="purchase_date"
              id="purchase_date"
              value={formData.purchase_date}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="value" className="block text-sm font-medium text-slate-700">
            Value
          </label>
          <div className="mt-1">
            <Input
              type="number"
              name="value"
              id="value"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">Enter the asset value in USD.</p>
        </div>
        
        <div className="sm:col-span-6">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate(isEditMode ? `/assets/${assetId}` : '/assets')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            isEditMode ? 'Update Asset' : 'Create Asset'
          )}
        </Button>
      </div>
    </form>
  );
}