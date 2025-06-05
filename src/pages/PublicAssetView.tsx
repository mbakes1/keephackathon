import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Database, AlertTriangle, MapPin, Mail, Phone, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase/supabase';

export default function PublicAssetView() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchAssetDetails = async () => {
      setLoading(true);
      
      try {
        // Only fetch limited, non-sensitive information for public view
        const { data, error } = await supabase
          .from('assets')
          .select('id, name, category')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setAsset(data);
        }
      } catch (error) {
        console.error('Error fetching asset details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssetDetails();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!id) return;
      
      // Submit theft report
      const { error } = await supabase
        .from('theft_reports')
        .insert([{
          asset_id: id,
          reporter_name: formData.name,
          reporter_email: formData.email,
          reporter_phone: formData.phone,
          location: formData.location,
          description: formData.description,
          status: 'pending',
        }]);
        
      if (error) throw error;
      
      // Reset form and show success message
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        description: '',
      });
      
      setReportSubmitted(true);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="text-center p-8 max-w-md">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="mt-4 text-xl font-medium text-slate-900">Asset not found</h2>
          <p className="mt-2 text-slate-500">The QR code you scanned doesn't link to a valid asset.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Database className="h-12 w-12 text-blue-600 mx-auto" />
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Keep Asset Management</h1>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-slate-900">Asset Information</h2>
            
            <div className="mt-4 grid grid-cols-1 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Asset Name</h3>
                <p className="mt-1 text-base text-slate-900">{asset.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500">Category</h3>
                <p className="mt-1 text-base text-slate-900">{asset.category}</p>
              </div>
            </div>
            
            {!showReportForm && !reportSubmitted && (
              <div className="mt-6">
                <Button 
                  onClick={() => setShowReportForm(true)}
                  className="w-full"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Found Item
                </Button>
                <p className="mt-2 text-xs text-center text-slate-500">
                  Is this item lost or stolen? Help it find its way back.
                </p>
              </div>
            )}
            
            {showReportForm && !reportSubmitted && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-slate-900">Report Found Item</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Please provide your contact information and details about where you found this item.
                </p>
                
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                      Your Name
                    </label>
                    <Input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                      Where did you find it?
                    </label>
                    <Input
                      type="text"
                      name="location"
                      id="location"
                      required
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                      Additional Details
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowReportForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      <Send className="mr-2 h-4 w-4" />
                      Submit Report
                    </Button>
                  </div>
                </form>
              </div>
            )}
            
            {reportSubmitted && (
              <div className="mt-6 p-4 bg-green-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Report Submitted</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Thank you for your report! The owner has been notified.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Powered by Keep Asset Management</p>
          <p className="mt-1">Secure asset tracking and recovery</p>
        </div>
      </div>
    </div>
  );
}