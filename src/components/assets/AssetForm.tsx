import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Upload, X, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase/supabase';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../lib/storage';

type AssetFormProps = {
  assetId?: string;
};

type FormStep = 'basic' | 'details' | 'documents' | 'review';

type UploadedFile = {
  file: File;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  url?: string;
  path?: string;
};

export default function AssetForm({ assetId }: AssetFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    serial_number: '',
    vin_identifier: '',
    purchase_date: '',
    asset_value_zar: '',
    status: 'available',
    asset_location: '',
    asset_condition: 'excellent',
    custom_fields: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedFile[]>([]);

  const isEditMode = !!assetId;

  const steps = [
    { id: 'basic', title: 'Basic Information', description: 'Asset name, category, and basic details' },
    { id: 'details', title: 'Asset Details', description: 'Value, condition, and location information' },
    { id: 'documents', title: 'Documentation', description: 'Upload photos and supporting documents' },
    { id: 'review', title: 'Review', description: 'Review and confirm asset information' }
  ];

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
    if (!assetId) return;
    
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
          vin_identifier: data.vin_identifier || '',
          purchase_date: data.purchase_date ? new Date(data.purchase_date).toISOString().split('T')[0] : '',
          asset_value_zar: data.asset_value_zar?.toString() || '',
          status: data.status,
          asset_location: data.asset_location || '',
          asset_condition: data.asset_condition || 'excellent',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'documents' | 'photos') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      uploading: false,
      uploaded: false,
    }));

    if (type === 'documents') {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    } else {
      setUploadedPhotos(prev => [...prev, ...newFiles]);
    }

    // Clear the input
    e.target.value = '';
  };

  // Helper function to perform the actual upload to Supabase storage
  const performUpload = async (file: File, type: 'documents' | 'photos', assetId: string, userId: string) => {
    try {
      let result;
      if (type === 'photos') {
        result = await StorageService.uploadPhoto(file, assetId, userId);
      } else {
        result = await StorageService.uploadDocument(file, assetId, userId);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        url: result.url,
        path: result.path,
        error: undefined
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      return {
        success: false,
        url: undefined,
        path: undefined,
        error: error.message || 'Upload failed'
      };
    }
  };

  const uploadFile = async (fileIndex: number, type: 'documents' | 'photos') => {
    if (!user?.id) return;

    const files = type === 'documents' ? uploadedFiles : uploadedPhotos;
    const setFiles = type === 'documents' ? setUploadedFiles : setUploadedPhotos;
    
    const fileToUpload = files[fileIndex];
    if (!fileToUpload || fileToUpload.uploading || fileToUpload.uploaded) return;

    // Update uploading state
    setFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { ...f, uploading: true, error: undefined } : f
    ));

    const result = await performUpload(fileToUpload.file, type, assetId || 'temp', user.id);

    // Update final state
    setFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { 
        ...f, 
        uploading: false, 
        uploaded: result.success, 
        url: result.url,
        path: result.path,
        error: result.error
      } : f
    ));
  };

  const removeFile = (index: number, type: 'documents' | 'photos') => {
    if (type === 'documents') {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('name')
        .eq('name', newCategory.trim())
        .single();
        
      if (existingCategories) {
        setError('Category already exists');
        return;
      }
      
      const { error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategory.trim(),
          owner_id: user?.id 
        }]);
        
      if (error) throw error;
      
      setCategories(prev => [...prev, newCategory.trim()]);
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      setShowNewCategoryInput(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Asset name is required');
      return false;
    }
    
    if (!formData.category.trim()) {
      setError('Category is required');
      return false;
    }
    
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }
    
    return true;
  };

  const saveAssetPhotos = async (assetId: string, photoFiles: UploadedFile[]) => {
    const uploadedPhotoFiles = photoFiles.filter(p => p.uploaded && p.url);
    
    for (const photo of uploadedPhotoFiles) {
      try {
        await supabase
          .from('asset_photos')
          .insert({
            asset_id: assetId,
            owner_id: user?.id!,
            photo_url: photo.url!,
            photo_description: photo.file.name,
            is_primary: uploadedPhotoFiles.indexOf(photo) === 0, // First photo is primary
          });
      } catch (error) {
        console.error('Error saving photo record:', error);
      }
    }
  };

  const saveAssetDocuments = async (assetId: string, documentFiles: UploadedFile[]) => {
    const uploadedDocumentFiles = documentFiles.filter(d => d.uploaded && d.url);
    
    for (const doc of uploadedDocumentFiles) {
      try {
        await supabase
          .from('asset_documents')
          .insert({
            asset_id: assetId,
            owner_id: user?.id!,
            document_name: doc.file.name,
            document_type: 'other', // Default type, could be enhanced with type detection
            file_url: doc.url!,
            file_size: doc.file.size,
          });
      } catch (error) {
        console.error('Error saving document record:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return;
    
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const assetData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim() || null,
        serial_number: formData.serial_number.trim() || null,
        vin_identifier: formData.vin_identifier.trim() || null,
        purchase_date: formData.purchase_date || null,
        asset_value_zar: formData.asset_value_zar ? parseFloat(formData.asset_value_zar) : null,
        status: formData.status,
        asset_location: formData.asset_location.trim() || null,
        asset_condition: formData.asset_condition,
        custom_fields: formData.custom_fields,
        owner_id: user?.id,
      };
      
      let assetResult;
      
      if (!isEditMode) {
        const { data, error } = await supabase
          .from('assets')
          .insert([assetData])
          .select()
          .single();
          
        if (error) {
          console.error('Supabase error:', error);
          throw new Error(error.message || 'Failed to create asset');
        }
        
        assetResult = data;
      } else {
        const { data, error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', assetId)
          .eq('owner_id', user?.id)
          .select()
          .single();
          
        if (error) {
          console.error('Supabase error:', error);
          throw new Error(error.message || 'Failed to update asset');
        }
        
        assetResult = data;
      }
      
      if (!assetResult) {
        throw new Error('No data returned from database');
      }

      // Create mutable copies of the file arrays
      const mutablePhotos = [...uploadedPhotos];
      const mutableDocuments = [...uploadedFiles];

      // Identify files that need uploading
      const photosToUpload = mutablePhotos
        .map((photo, index) => ({ photo, index }))
        .filter(({ photo }) => !photo.uploaded && !photo.uploading);
      
      const documentsToUpload = mutableDocuments
        .map((doc, index) => ({ doc, index }))
        .filter(({ doc }) => !doc.uploaded && !doc.uploading);

      // Mark files as uploading in mutable copies
      photosToUpload.forEach(({ index }) => {
        mutablePhotos[index] = { ...mutablePhotos[index], uploading: true, error: undefined };
      });
      
      documentsToUpload.forEach(({ index }) => {
        mutableDocuments[index] = { ...mutableDocuments[index], uploading: true, error: undefined };
      });

      // Update state to show uploading status
      setUploadedPhotos([...mutablePhotos]);
      setUploadedFiles([...mutableDocuments]);

      // Upload all pending files concurrently
      const photoUploadPromises = photosToUpload.map(async ({ photo, index }) => {
        const result = await performUpload(photo.file, 'photos', assetResult.id, user!.id);
        mutablePhotos[index] = {
          ...mutablePhotos[index],
          uploading: false,
          uploaded: result.success,
          url: result.url,
          path: result.path,
          error: result.error
        };
      });

      const documentUploadPromises = documentsToUpload.map(async ({ doc, index }) => {
        const result = await performUpload(doc.file, 'documents', assetResult.id, user!.id);
        mutableDocuments[index] = {
          ...mutableDocuments[index],
          uploading: false,
          uploaded: result.success,
          url: result.url,
          path: result.path,
          error: result.error
        };
      });

      // Wait for all uploads to complete
      await Promise.all([...photoUploadPromises, ...documentUploadPromises]);

      // Update state with final results
      setUploadedPhotos([...mutablePhotos]);
      setUploadedFiles([...mutableDocuments]);

      // Save photo and document records to database using the updated mutable arrays
      await saveAssetPhotos(assetResult.id, mutablePhotos);
      await saveAssetDocuments(assetResult.id, mutableDocuments);
      
      // Navigate to the asset detail page
      navigate(`/assets/${assetResult.id}`);
      
    } catch (error: any) {
      console.error('Error saving asset:', error);
      setError(error.message || 'An unexpected error occurred while saving the asset');
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  const nextStep = () => {
    const stepOrder: FormStep[] = ['basic', 'details', 'documents', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const stepOrder: FormStep[] = ['basic', 'details', 'documents', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep === step.id 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : steps.findIndex(s => s.id === currentStep) > index
                ? 'bg-green-600 border-green-600 text-white'
                : 'border-slate-300 text-slate-500'
            }`}>
              {steps.findIndex(s => s.id === currentStep) > index ? '✓' : index + 1}
            </div>
            <div className="ml-3 hidden sm:block">
              <p className={`text-sm font-medium ${
                currentStep === step.id ? 'text-blue-600' : 'text-slate-500'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-slate-400">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                steps.findIndex(s => s.id === currentStep) > index ? 'bg-green-600' : 'bg-slate-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Asset Name*
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
        
        <div className="sm:col-span-1">
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Category*
          </label>
          {showNewCategoryInput ? (
            <div className="flex space-x-2 mt-1">
              <Input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddCategory} size="sm">
                Add
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowNewCategoryInput(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2 mt-1">
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
                size="sm"
                onClick={() => setShowNewCategoryInput(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="sm:col-span-1">
          <label htmlFor="status" className="block text-sm font-medium text-slate-700">
            Status*
          </label>
          <select
            id="status"
            name="status"
            required
            value={formData.status}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="asset_value_zar" className="block text-sm font-medium text-slate-700">
            Asset Value (ZAR)*
          </label>
          <Input
            type="number"
            name="asset_value_zar"
            id="asset_value_zar"
            min="0"
            step="0.01"
            value={formData.asset_value_zar}
            onChange={handleInputChange}
            placeholder="0.00"
            className="mt-1"
          />
          <p className="mt-1 text-sm text-slate-500">Enter the asset value in South African Rand.</p>
        </div>
        
        <div>
          <label htmlFor="purchase_date" className="block text-sm font-medium text-slate-700">
            Purchase Date
          </label>
          <Input
            type="date"
            name="purchase_date"
            id="purchase_date"
            value={formData.purchase_date}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
        
        <div>
          <label htmlFor="serial_number" className="block text-sm font-medium text-slate-700">
            Serial Number
          </label>
          <Input
            type="text"
            name="serial_number"
            id="serial_number"
            value={formData.serial_number}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
        
        <div>
          <label htmlFor="vin_identifier" className="block text-sm font-medium text-slate-700">
            VIN/Unique Identifier
          </label>
          <Input
            type="text"
            name="vin_identifier"
            id="vin_identifier"
            value={formData.vin_identifier}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
        
        <div>
          <label htmlFor="asset_condition" className="block text-sm font-medium text-slate-700">
            Asset Condition*
          </label>
          <select
            id="asset_condition"
            name="asset_condition"
            required
            value={formData.asset_condition}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="asset_location" className="block text-sm font-medium text-slate-700">
            Asset Location/Address
          </label>
          <Input
            type="text"
            name="asset_location"
            id="asset_location"
            value={formData.asset_location}
            onChange={handleInputChange}
            placeholder="e.g., Cape Town Office, Home Address"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderFileUploadSection = (
    title: string,
    description: string,
    acceptedTypes: string,
    files: UploadedFile[],
    type: 'documents' | 'photos'
  ) => (
    <div>
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
      
      <div className="mt-4">
        <label className="block">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">Click to upload {type}</p>
            <p className="text-xs text-slate-500">{acceptedTypes}</p>
          </div>
          <input
            type="file"
            multiple
            accept={type === 'photos' ? 'image/*' : '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt'}
            onChange={(e) => handleFileUpload(e, type)}
            className="hidden"
          />
        </label>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-slate-700">Files:</h4>
          <div className="mt-2 space-y-2">
            {files.map((fileItem, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {fileItem.uploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : fileItem.uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                    ) : fileItem.error ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-slate-600">{fileItem.file.name}</span>
                    <p className="text-xs text-slate-500">
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {fileItem.error && (
                      <p className="text-xs text-red-600">{fileItem.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!fileItem.uploaded && !fileItem.uploading && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => uploadFile(index, type)}
                    >
                      Upload
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index, type)}
                    disabled={fileItem.uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="space-y-6">
      {renderFileUploadSection(
        'Upload Asset Photos',
        'Upload photos of your asset for identification purposes.',
        'PNG, JPG, WebP up to 10MB each',
        uploadedPhotos,
        'photos'
      )}
      
      {renderFileUploadSection(
        'Upload Supporting Documents',
        'Upload proof of purchase, warranties, FICA compliance documents, etc.',
        'PDF, DOC, DOCX, images, text files up to 10MB each',
        uploadedFiles,
        'documents'
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-slate-900">Review Asset Information</h3>
      
      <div className="bg-slate-50 p-6 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-slate-500">Asset Name</h4>
            <p className="text-sm text-slate-900">{formData.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">Category</h4>
            <p className="text-sm text-slate-900">{formData.category}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">Value (ZAR)</h4>
            <p className="text-sm text-slate-900">R {formData.asset_value_zar || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">Condition</h4>
            <p className="text-sm text-slate-900 capitalize">{formData.asset_condition}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">Location</h4>
            <p className="text-sm text-slate-900">{formData.asset_location || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">Status</h4>
            <p className="text-sm text-slate-900 capitalize">{formData.status}</p>
          </div>
        </div>
        
        {formData.description && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-500">Description</h4>
            <p className="text-sm text-slate-900">{formData.description}</p>
          </div>
        )}
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-slate-500">Photos</h4>
            <p className="text-sm text-slate-900">
              {uploadedPhotos.length} file(s) 
              ({uploadedPhotos.filter(p => p.uploaded).length} uploaded)
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">Documents</h4>
            <p className="text-sm text-slate-900">
              {uploadedFiles.length} file(s) 
              ({uploadedFiles.filter(d => d.uploaded).length} uploaded)
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading && isEditMode && !formData.name) {
    return (
      <div className="flex justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}
      
      {renderStepIndicator()}
      
      <div className="min-h-[400px]">
        {currentStep === 'basic' && renderBasicStep()}
        {currentStep === 'details' && renderDetailsStep()}
        {currentStep === 'documents' && renderDocumentsStep()}
        {currentStep === 'review' && renderReviewStep()}
      </div>
      
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={currentStep === 'basic' ? () => navigate('/assets') : prevStep}
          disabled={loading}
        >
          {currentStep === 'basic' ? 'Cancel' : 'Previous'}
        </Button>
        
        <div className="flex space-x-3">
          {currentStep !== 'review' ? (
            <Button type="button" onClick={nextStep} disabled={loading}>
              Next
            </Button>
          ) : (
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
          )}
        </div>
      </div>
    </form>
  );
}