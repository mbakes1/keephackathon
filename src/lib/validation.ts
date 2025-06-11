export class ValidationService {
  // Asset validation
  static validateAssetData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Asset name is required');
    } else if (data.name.trim().length > 255) {
      errors.push('Asset name must be less than 255 characters');
    }

    if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
      errors.push('Category is required');
    }

    if (data.description && typeof data.description === 'string' && data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    if (data.serial_number && typeof data.serial_number === 'string' && data.serial_number.length > 100) {
      errors.push('Serial number must be less than 100 characters');
    }

    if (data.vin_identifier && typeof data.vin_identifier === 'string' && data.vin_identifier.length > 100) {
      errors.push('VIN/Identifier must be less than 100 characters');
    }

    if (data.asset_value_zar && (typeof data.asset_value_zar !== 'number' || data.asset_value_zar < 0)) {
      errors.push('Asset value must be a positive number');
    }

    if (data.purchase_date && !this.isValidDate(data.purchase_date)) {
      errors.push('Purchase date must be a valid date');
    }

    const validStatuses = ['available', 'assigned', 'maintenance', 'retired'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Status must be one of: available, assigned, maintenance, retired');
    }

    const validConditions = ['excellent', 'good', 'fair', 'poor'];
    if (data.asset_condition && !validConditions.includes(data.asset_condition)) {
      errors.push('Condition must be one of: excellent, good, fair, poor');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Profile validation
  static validateProfileData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.email || typeof data.email !== 'string' || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (data.full_name && typeof data.full_name === 'string' && data.full_name.length > 255) {
      errors.push('Full name must be less than 255 characters');
    }

    const validRoles = ['admin', 'user', 'viewer'];
    if (data.role && !validRoles.includes(data.role)) {
      errors.push('Role must be one of: admin, user, viewer');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Note validation
  static validateNoteData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.note_text || typeof data.note_text !== 'string' || data.note_text.trim().length === 0) {
      errors.push('Note text is required');
    } else if (data.note_text.length > 2000) {
      errors.push('Note text must be less than 2000 characters');
    }

    const validCategories = ['general', 'maintenance', 'repairs', 'modifications', 'insurance'];
    if (data.note_category && !validCategories.includes(data.note_category)) {
      errors.push('Note category must be one of: general, maintenance, repairs, modifications, insurance');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Insurance validation
  static validateInsuranceData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.is_insured === true) {
      if (!data.insurance_provider || typeof data.insurance_provider !== 'string' || data.insurance_provider.trim().length === 0) {
        errors.push('Insurance provider is required when asset is insured');
      }

      if (data.coverage_amount && (typeof data.coverage_amount !== 'number' || data.coverage_amount < 0)) {
        errors.push('Coverage amount must be a positive number');
      }

      if (data.premium_amount && (typeof data.premium_amount !== 'number' || data.premium_amount < 0)) {
        errors.push('Premium amount must be a positive number');
      }

      if (data.renewal_date && !this.isValidDate(data.renewal_date)) {
        errors.push('Renewal date must be a valid date');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Assignment validation
  static validateAssignmentData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.asset_id || typeof data.asset_id !== 'string') {
      errors.push('Asset ID is required');
    }

    if (!data.assigned_to || typeof data.assigned_to !== 'string') {
      errors.push('Assigned to user ID is required');
    }

    if (!data.assigned_by || typeof data.assigned_by !== 'string') {
      errors.push('Assigned by user ID is required');
    }

    if (data.due_date && !this.isValidDate(data.due_date)) {
      errors.push('Due date must be a valid date');
    }

    if (data.return_date && !this.isValidDate(data.return_date)) {
      errors.push('Return date must be a valid date');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Theft report validation
  static validateTheftReportData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.asset_id || typeof data.asset_id !== 'string') {
      errors.push('Asset ID is required');
    }

    if (data.reporter_email && !this.isValidEmail(data.reporter_email)) {
      errors.push('Reporter email must be valid');
    }

    if (data.description && typeof data.description === 'string' && data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    const validStatuses = ['pending', 'resolved', 'dismissed'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('Status must be one of: pending, resolved, dismissed');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Category validation
  static validateCategoryData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Category name is required');
    } else if (data.name.trim().length > 100) {
      errors.push('Category name must be less than 100 characters');
    }

    if (data.description && typeof data.description === 'string' && data.description.length > 500) {
      errors.push('Category description must be less than 500 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // File validation
  static validateFile(file: File, type: 'photo' | 'document'): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    if (type === 'photo') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        errors.push('Photo must be JPEG, PNG, or WebP format');
      }
    } else if (type === 'document') {
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
        errors.push('Document must be PDF, DOC, DOCX, image, or text format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Helper methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // Sanitization methods
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static sanitizeNumber(input: any): number | null {
    const num = parseFloat(input);
    return isNaN(num) ? null : num;
  }

  static sanitizeBoolean(input: any): boolean {
    return Boolean(input);
  }
}