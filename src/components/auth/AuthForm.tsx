import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, LogIn } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'login' | 'register';

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) return;
    
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          throw error;
        }
        // Navigation will be handled by the auth state change
        navigate('/');
      } else {
        if (!fullName.trim()) {
          throw new Error('Full name is required');
        }
        
        const { error } = await signUp(email, password, fullName.trim());
        if (error) {
          throw error;
        }
        
        // After successful registration, show success message
        setError('Registration successful! Please check your email to verify your account, then sign in.');
        setMode('login');
        setEmail('');
        setPassword('');
        setFullName('');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Database className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Sign in to Keep' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {mode === 'login' 
              ? 'Sign in to manage your organization\'s assets' 
              : 'Register to start tracking your organization\'s assets'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`p-4 rounded-md ${error.includes('successful') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                  disabled={loading}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                disabled={loading}
                minLength={6}
              />
              {mode === 'register' && (
                <p className="mt-1 text-xs text-slate-500">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  {mode === 'login' ? 'Sign in' : 'Register'}
                </span>
              )}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                {mode === 'login'
                  ? 'Don\'t have an account? Sign up'
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}