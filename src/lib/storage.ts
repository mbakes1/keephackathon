import { supabase } from './supabase/supabase';

export type UploadResult = {
  url: string;
  path: string;
  error?: string;
};

export class StorageService {
  private static readonly PHOTO_BUCKET = 'asset-photos';
  private static readonly DOCUMENT_BUCKET = 'asset-documents';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static async uploadPhoto(file: File, assetId: string, ownerId: string): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validatePhotoFile(file);
      if (!validation.valid) {
        return { url: '', path: '', error: validation.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${ownerId}/${assetId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.PHOTO_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { url: '', path: '', error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.PHOTO_BUCKET)
        .getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path
      };
    } catch (error: any) {
      console.error('Upload photo error:', error);
      return { url: '', path: '', error: error.message || 'Upload failed' };
    }
  }

  static async uploadDocument(file: File, assetId: string, ownerId: string): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateDocumentFile(file);
      if (!validation.valid) {
        return { url: '', path: '', error: validation.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${ownerId}/${assetId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.DOCUMENT_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { url: '', path: '', error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.DOCUMENT_BUCKET)
        .getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path
      };
    } catch (error: any) {
      console.error('Upload document error:', error);
      return { url: '', path: '', error: error.message || 'Upload failed' };
    }
  }

  static async deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Storage delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message || 'Delete failed' };
    }
  }

  private static validatePhotoFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    return { valid: true };
  }

  private static validateDocumentFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only PDF, DOC, DOCX, images, and text files are allowed' };
    }

    return { valid: true };
  }

  static getPhotoBucket(): string {
    return this.PHOTO_BUCKET;
  }

  static getDocumentBucket(): string {
    return this.DOCUMENT_BUCKET;
  }
}