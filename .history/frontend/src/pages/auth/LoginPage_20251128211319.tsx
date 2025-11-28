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
  department?: string;
  auth_provider?: 'local' | 'google';
  created_at?: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Handle SSO button click (placeholder)
  const handleSSOClick = () => {
    setError('SSO authentication is not yet configured. Please use Login ID & Password.');
  };

  // Handle login with ID and Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login with ID:', loginId);

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        login_id: loginId.trim(),
        password: password,
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('📥 Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        console.log('✅ Login successful:', {
          userId: user.id,
          loginId: user.login_id,
          databaseRole: user.role,
          fullName: user.full_name
        });
        
        // Store token with expiry
        const tokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExpiry', tokenExpiry.toString());
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('💾 Stored in localStorage:', {
          token: token.substring(0, 20) + '...',
          user: user
        });
        
        // Call onLogin to update App state
        onLogin(user);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (err.response) {
        // Server responded with error
        setError(err.response.data?.message || 'Invalid credentials');
      } else if (err.request) {
        // Request made but no response
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">Electronic Permit To Work System</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 border-l-4 border-red-500 rounded-lg bg-red-50">
            <div className="flex items-start">
              <svg className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="loginId" className="block text-sm font-medium text-gray-700">
              Login ID
            </label>
            <input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              disabled={loading}
              className="block w-full px-4 py-3 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter your login ID"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="block w-full px-4 py-3 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full px-4 py-3 text-base font-semibold text-white transition-all duration-200 transform bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 text-gray-500 bg-white">Or continue with</span>
          </div>
        </div>

        {/* SSO Button */}
        <button
          type="button"
          onClick={handleSSOClick}
          disabled={loading}
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Amazon SSO
        </button>

        {/* Sign Up Link */}
        <div className="mt-6 text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign up
          </Link>
        </div>

        {/* Test Credentials Info */}
        <div className="p-4 mt-6 border border-blue-200 rounded-lg bg-blue-50">
          <p className="mb-2 text-xs font-semibold text-blue-900">Test Credentials:</p>
          <div className="space-y-1 text-xs text-blue-800">
            <p>• Admin: <code className="px-1 bg-blue-100 rounded">admin</code></p>
            <p>• Safety: <code className="px-1 bg-blue-100 rounded">safe1</code></p>
            <p>• Manager: <code className="px-1 bg-blue-100 rounded">area1</code></p>
            <p>• Worker: <code className="px-1 bg-blue-100 rounded">request1</code></p>
            <p className="mt-2">Password: <code className="px-1 bg-blue-100 rounded">any password</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;