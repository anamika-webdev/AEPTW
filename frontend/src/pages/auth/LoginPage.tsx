import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { getHighestPriorityRole } from '../../utils/roleMapper';

import { User } from '../../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}


const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
  }, [location]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const handleSSOClick = () => {
    setError('SSO authentication is not yet configured. Please use Login ID & Password.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login...');

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        login_id: loginId.trim(),
        password: password,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      if (response.data.success) {
        const { token, user } = response.data.data;

        console.log('✅ Login successful');
        console.log('👤 User role from DB:', user.role);

        // Map the role using prioritized logic
        const frontendRole = getHighestPriorityRole(user.role);
        console.log('🎭 Mapped frontend role:', frontendRole);

        const mappedUser: User = {
          ...user,
          frontendRole: frontendRole
        };

        // Save token
        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);

        // Save user
        const userStr = JSON.stringify(mappedUser);
        localStorage.setItem('user', userStr);
        sessionStorage.setItem('user', userStr);

        // Also store role separately for easy access
        localStorage.setItem('userRole', frontendRole);
        sessionStorage.setItem('userRole', frontendRole);

        console.log('💾 Stored user data:', mappedUser);

        // Call onLogin
        onLogin(mappedUser);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">


      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center justify-center p-3 bg-white shadow-lg rounded-xl">
                <img src="/logo.jpg" alt="Amazon Logo" className="h-16 w-auto object-contain" />
              </div>
            </div>
          </div>

          <h2 className="mt-2 text-sm font-bold text-black-600">Sign in to EPTW System</h2>

          {/* Safe to Go Logo */}
          <div className="mt-4">
            <img
              src="/safetogologo.png"
              alt="Safe to Go"
              className="h-10 w-auto object-contain mx-auto"
            />
          </div>

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
            className="w-full px-4 py-3 font-semibold text-white transition-all rounded-lg shadow-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="w-full px-4 py-3 font-medium text-white transition-all bg-orange-400 border border-gray-300 rounded-lg shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center">
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