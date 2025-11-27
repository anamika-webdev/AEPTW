// frontend/src/pages/auth/LoginPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// User interface
interface User {
  id: number;
  login_id: string;
  full_name: string;
  email: string;
  role: string;
  frontendRole?: 'Admin' | 'Supervisor' | 'Worker';
  department?: string;
  auth_provider?: 'local' | 'google';
  created_at?: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

// Role mapping function
function mapDatabaseRoleToFrontend(dbRole: string): 'Admin' | 'Supervisor' | 'Worker' {
  if (dbRole === 'Admin') {
    return 'Admin';
  }
  return 'Supervisor';
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Generate login_id from email (part before @)
  const generateLoginId = (email: string): string => {
    return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
  };

  // Regular login with password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Generate login_id from email
      const login_id = generateLoginId(email);

      console.log('Attempting login:', {
        email,
        login_id
      });

      const response = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
        login_id: login_id,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Login response:', response.data);

      if (response.data.success) {
        // ✅ FIX: Access token and user from response.data.data (not response.data)
        const { token, user } = response.data.data;
        
        console.log('Extracted user data:', user);
        
        // Map database role to frontend role
        const mappedUser: User = {
          ...user,
          frontendRole: mapDatabaseRoleToFrontend(user.role)
        };
        
        console.log('Login successful:', {
          databaseRole: user.role,
          frontendRole: mappedUser.frontendRole,
          authProvider: user.auth_provider || 'local'
        });
        
        // Store token with expiry
        const tokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExpiry', tokenExpiry.toString());
        localStorage.setItem('user', JSON.stringify(mappedUser));
        
        onLogin(mappedUser);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (err.response) {
        // Server responded with error
        const errorMessage = err.response.data?.message || 'Login failed';
        const statusCode = err.response.status;
        
        console.error('Server error:', {
          status: statusCode,
          message: errorMessage,
          data: err.response.data
        });
        
        if (statusCode === 401) {
          if (errorMessage.includes('Google Sign-In')) {
            setError(errorMessage);
          } else {
            setError('Invalid email or password. Please try again.');
          }
        } else if (statusCode === 500) {
          setError('Server error. Please try again later or contact support.');
        } else {
          setError(errorMessage);
        }
      } else if (err.request) {
        // Request made but no response
        console.error('No response from server:', err.request);
        setError('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
      } else {
        // Error in request setup
        console.error('Request error:', err.message);
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google SSO Login Handler
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/v1/auth/google`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to Amazon EPTW System
          </p>
        </div>

        {/* Login Options */}
        {!showTraditionalLogin ? (
          <div className="space-y-4">
            {/* Google SSO Button */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 transition-colors duration-200 bg-white border border-gray-300 rounded-lg group hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google SSO
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-gradient-to-br from-blue-50 to-indigo-100">Or</span>
              </div>
            </div>

            {/* Traditional Login Link */}
            <div className="text-center">
              <button
                onClick={() => setShowTraditionalLogin(true)}
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
              >
                Sign in with Password →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Traditional Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex">
                    <svg 
                      className="flex-shrink-0 w-5 h-5 text-red-400" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                      {error.includes('backend is running') && (
                        <p className="mt-1 text-xs text-red-700">
                          Make sure your backend server is running: <code className="px-1 py-0.5 bg-red-100 rounded">npm run dev</code>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white transition-colors duration-200 bg-blue-600 border border-transparent rounded-lg group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>

              {/* Back to SSO */}
              <div className="text-center">
                <button
                  onClick={() => setShowTraditionalLogin(false)}
                  type="button"
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
                >
                  ← Back to SSO Login
                </button>
              </div>
            </form>
          </>
        )}

        {/* Signup Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-blue-600 transition-colors hover:text-blue-500"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex">
            <svg className="flex-shrink-0 w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-xs text-blue-700">
                <strong>SSO Login:</strong> For Amazon employees with corporate accounts
              </p>
              <p className="mt-1 text-xs text-blue-600">
                <strong>Password Login:</strong> Use your email and password to sign in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;