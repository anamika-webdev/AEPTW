import { useState } from 'react';
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
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Regular login with password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
        login_id: loginId,
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        
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
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(mappedUser));
        
        onLogin(mappedUser);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message;
      
      if (err.response?.status === 401) {
        setError('Invalid login credentials. Please check your Login ID and password.');
      } else if (err.response?.status === 400) {
        setError(errorMessage || 'Please enter both Login ID and password.');
      } else {
        setError('Login failed. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  // SSO login
  const handleSSOLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${API_BASE_URL}/v1/auth/google`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-10 space-y-8 bg-white shadow-xl rounded-2xl">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Amazon EPTW
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Electronic Permit to Work System
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="login_id" className="block mb-1 text-sm font-medium text-gray-700">
                Login ID
              </label>
              <input
                id="login_id"
                name="login_id"
                type="text"
                autoComplete="username"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your login ID"
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
                <p className="ml-3 text-sm text-red-800">{error}</p>
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
                  <svg 
                    className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">Or</span>
          </div>
        </div>

        {/* SSO Button */}
        <div>
          <button
            type="button"
            onClick={handleSSOLogin}
            className="flex items-center justify-center w-full gap-3 px-4 py-3 font-medium text-gray-700 transition-colors duration-200 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <svg 
              className="w-5 h-5 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
              />
            </svg>
            <span>Sign in with SSO</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-center text-gray-500">
          <p>© 2024 Amazon EPTW. All rights reserved.</p>
          <p className="mt-1">Secured by Amazon Web Services</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;