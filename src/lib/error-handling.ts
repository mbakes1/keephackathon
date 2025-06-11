export class ErrorHandler {
  private static errorLog: Array<{
    timestamp: Date;
    error: Error;
    context?: string;
    userId?: string;
  }> = [];

  static logError(error: Error, context?: string, userId?: string) {
    const errorEntry = {
      timestamp: new Date(),
      error,
      context,
      userId
    };

    this.errorLog.push(errorEntry);
    
    // Keep only last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorEntry);
    }

    // In production, you might want to send to an error tracking service
    // this.sendToErrorService(errorEntry);
  }

  static getErrorLog() {
    return [...this.errorLog];
  }

  static clearErrorLog() {
    this.errorLog.length = 0;
  }

  // Database error handling
  static handleDatabaseError(error: any, operation: string): string {
    this.logError(error, `Database operation: ${operation}`);

    // Handle specific Supabase/PostgreSQL errors
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique violation
          return 'This record already exists. Please use different values.';
        case '23503': // Foreign key violation
          return 'Cannot perform this operation due to related records.';
        case '23502': // Not null violation
          return 'Required fields are missing.';
        case '42501': // Insufficient privilege
          return 'You do not have permission to perform this action.';
        case 'PGRST116': // Row not found
          return 'The requested record was not found.';
        case 'PGRST301': // Row level security violation
          return 'Access denied. You can only access your own data.';
        default:
          return error.message || 'A database error occurred.';
      }
    }

    // Handle network errors
    if (error.message?.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    return error.message || 'An unexpected error occurred.';
  }

  // Authentication error handling
  static handleAuthError(error: any): string {
    this.logError(error, 'Authentication');

    if (error.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('invalid login credentials')) {
        return 'Invalid email or password. Please check your credentials.';
      }
      
      if (message.includes('user already registered')) {
        return 'An account with this email already exists.';
      }
      
      if (message.includes('password should be at least')) {
        return 'Password must be at least 6 characters long.';
      }
      
      if (message.includes('invalid email')) {
        return 'Please enter a valid email address.';
      }
      
      if (message.includes('email not confirmed')) {
        return 'Please check your email and click the confirmation link.';
      }
      
      if (message.includes('signup disabled')) {
        return 'New registrations are currently disabled.';
      }
    }

    return error.message || 'Authentication failed. Please try again.';
  }

  // Storage error handling
  static handleStorageError(error: any, operation: string): string {
    this.logError(error, `Storage operation: ${operation}`);

    if (error.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('bucket not found')) {
        return 'Storage configuration error. Please contact support.';
      }
      
      if (message.includes('file size')) {
        return 'File is too large. Maximum size is 10MB.';
      }
      
      if (message.includes('file type')) {
        return 'File type not supported. Please use a different format.';
      }
      
      if (message.includes('quota exceeded')) {
        return 'Storage quota exceeded. Please delete some files or upgrade your plan.';
      }
    }

    return error.message || 'File operation failed. Please try again.';
  }

  // Validation error handling
  static handleValidationError(errors: string[]): string {
    this.logError(new Error('Validation failed'), 'Validation', undefined);
    
    if (errors.length === 1) {
      return errors[0];
    }
    
    return `Please fix the following issues:\n• ${errors.join('\n• ')}`;
  }

  // Network error handling
  static handleNetworkError(error: any): string {
    this.logError(error, 'Network');

    if (!navigator.onLine) {
      return 'You appear to be offline. Please check your internet connection.';
    }

    if (error.name === 'AbortError') {
      return 'Request was cancelled.';
    }

    if (error.name === 'TimeoutError') {
      return 'Request timed out. Please try again.';
    }

    return 'Network error. Please check your connection and try again.';
  }

  // Generic error boundary handler
  static handleComponentError(error: Error, errorInfo: any): void {
    this.logError(error, 'Component Error');
    
    console.error('Component error:', error);
    console.error('Error info:', errorInfo);
    
    // In production, you might want to send this to an error tracking service
  }

  // Retry mechanism for failed operations
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain types of errors
        if (this.shouldNotRetry(error)) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          this.logError(error, `Failed after ${maxRetries + 1} attempts`);
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
    
    throw lastError!;
  }

  private static shouldNotRetry(error: any): boolean {
    // Don't retry on authentication errors
    if (error.message?.includes('auth')) {
      return true;
    }
    
    // Don't retry on validation errors
    if (error.message?.includes('validation')) {
      return true;
    }
    
    // Don't retry on permission errors
    if (error.code === '42501' || error.code === 'PGRST301') {
      return true;
    }
    
    return false;
  }

  // Error reporting (placeholder for external service integration)
  private static async sendToErrorService(errorEntry: any) {
    // This would integrate with services like Sentry, LogRocket, etc.
    // Example:
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorEntry)
    // });
  }
}