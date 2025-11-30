import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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

// Map database roles to frontend roles
function mapDatabaseRoleToFrontend(dbRole: string): 'Admin' | 'Supervisor' | 'Worker' {
  const role = dbRole?.toLowerCase();
  
  if (role === 'admin' || role === 'administrator') {
    return 'Admin';
  }
  
  if (role === 'worker') {
    return 'Worker';
  }
  
  return 'Supervisor';
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const handleSSOClick = () => {
    setError('SSO authentication is not yet configured. Please use Login ID & Password.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        login_id: loginId.trim(),
        password: password,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Map the role
        const mappedUser: User = {
          ...user,
          frontendRole: mapDatabaseRoleToFrontend(user.role)
        };

        // Save token
        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);
        
        // Save user
        const userStr = JSON.stringify(mappedUser);
        localStorage.setItem('user', userStr);
        sessionStorage.setItem('user', userStr);
        
        // Call onLogin
        onLogin(mappedUser);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-2xl rounded-2xl">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-32 h-20 shadow-lg bg-gradient-to-br from-orange-400 to-orange-400 rounded-xl">
              <span className="text-3xl font-bold text-white">Amazon</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to EPTW System</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50">
            <p className="font-medium">Login Failed</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="loginId" className="block mb-2 text-sm font-medium text-gray-700">
              Login ID
            </label>
            <input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 text-gray-900 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter your login ID"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 text-gray-900 transition-all border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-semibold text-white transition-all rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
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
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">Or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSSOClick}
          disabled={loading}
          className="w-full px-4 py-3 font-medium text-white transition-all bg-orange-400 border border-gray-300 rounded-lg shadow-sm text-white-700 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center ">
            Sign in with SSO
          </span>
        </button>

        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;