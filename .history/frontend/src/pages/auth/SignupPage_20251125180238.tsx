// frontend/src/pages/auth/SignupPage.tsx
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
}

interface SignupPageProps {
  onLogin: (user: User) => void;
}

// Role mapping function
function mapDatabaseRoleToFrontend(dbRole: string): 'Admin' | 'Supervisor' | 'Worker' {
  if (dbRole === 'Admin') {
    return 'Admin';
  }
  return 'Supervisor';
}

const SignupPage: React.FC<SignupPageProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    role: 'Requester',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Generate login_id from email (part before @)
  const generateLoginId = (email: string): string => {
    return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
  };

  // Validate individual fields
  const validateField = (name: string, value: string) => {
    let errorMessage = '';

    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errorMessage = 'Invalid email format';
        }
        break;
      case 'full_name':
        if (value.length < 2) {
          errorMessage = 'Full name must be at least 2 characters';
        }
        break;
      case 'password':
        if (value.length < 8) {
          errorMessage = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])/.test(value)) {
          errorMessage = 'Password must contain lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
          errorMessage = 'Password must contain uppercase letter';
        } else if (!/(?=.*\d)/.test(value)) {
          errorMessage = 'Password must contain a number';
        } else if (!/(?=.*[@$!%*?&])/.test(value)) {
          errorMessage = 'Password must contain special character (@$!%*?&)';
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          errorMessage = 'Passwords do not match';
        }
        break;
    }

    setValidationErrors(prev => ({ ...prev, [name]: errorMessage }));
    return errorMessage === '';
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear general error when user types
    if (error) {
      setError('');
    }
    
    // Clear field-specific error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      validateField(name, value);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all fields
    const isEmailValid = validateField('email', formData.email);
    const isFullNameValid = validateField('full_name', formData.full_name);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);

    if (!isEmailValid || !isFullNameValid || !isPasswordValid || !isConfirmPasswordValid) {
      setError('Please fix all validation errors');
      setLoading(false);
      return;
    }

    try {
      // Generate login_id from email
      const login_id = generateLoginId(formData.email);

      console.log('Submitting registration:', {
        login_id,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        department: formData.department || null
      });

      const response = await axios.post(`${API_BASE_URL}/v1/auth/register`, {
        login_id: login_id,
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || null
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Registration response:', response.data);

      if (response.data.success) {
        // ✅ FIX: Access token and user from response.data.data (not response.data)
        const { token, user } = response.data.data;
        
        console.log('Extracted user data:', user);
        
        // Map database role to frontend role
        const mappedUser: User = {
          ...user,
          frontendRole: mapDatabaseRoleToFrontend(user.role)
        };
        
        console.log('Registration successful:', {
          databaseRole: user.role,
          frontendRole: mappedUser.frontendRole,
          authProvider: 'local'
        });
        
        // Store token with expiry
        const tokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExpiry', tokenExpiry.toString());
        localStorage.setItem('user', JSON.stringify(mappedUser));
        
        onLogin(mappedUser);
      } else {
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (err.response) {
        // Server responded with error
        const errorMessage = err.response.data?.message || 'Registration failed';
        const statusCode = err.response.status;
        
        console.error('Server error:', {
          status: statusCode,
          message: errorMessage,
          data: err.response.data
        });
        
        if (statusCode === 409) {
          setError('An account with this email already exists. Please use a different email or try logging in.');
        } else if (statusCode === 400) {
          setError(errorMessage || 'Please check all required fields and try again.');
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
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Amazon EPTW system
          </p>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={(e) => validateField('email', e.target.value)}
              className={`relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:z-10 sm:text-sm ${
                validationErrors.email
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter your email address"
              autoComplete="email"
            />
            {validationErrors.email && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
            )}
            {formData.email && !validationErrors.email && (
              <p className="mt-1 text-xs text-gray-500">
                Your login ID will be: <span className="font-semibold">{generateLoginId(formData.email)}</span>
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block mb-1 text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
              onBlur={(e) => validateField('full_name', e.target.value)}
              className={`relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:z-10 sm:text-sm ${
                validationErrors.full_name
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter your full name"
              autoComplete="name"
            />
            {validationErrors.full_name && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.full_name}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block mb-1 text-sm font-medium text-gray-700">
              Role *
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="relative block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            >
              <option value="Requester">Requester (Worker)</option>
              <option value="Approver_Safety">Safety Officer</option>
              <option value="Approver_AreaManager">Area Manager</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          {/* Department (Optional) */}
          <div>
            <label htmlFor="department" className="block mb-1 text-sm font-medium text-gray-700">
              Department (Optional)
            </label>
            <input
              id="department"
              name="department"
              type="text"
              value={formData.department}
              onChange={handleChange}
              className="relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your department"
              autoComplete="organization"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              onBlur={(e) => validateField('password', e.target.value)}
              className={`relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:z-10 sm:text-sm ${
                validationErrors.password
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Enter your password"
              autoComplete="new-password"
            />
            {validationErrors.password && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Min 8 characters with uppercase, lowercase, number & special character (@$!%*?&)
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium text-gray-700">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={(e) => validateField('confirmPassword', e.target.value)}
              className={`relative block w-full px-4 py-3 text-gray-900 placeholder-gray-500 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:z-10 sm:text-sm ${
                validationErrors.confirmPassword
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
            )}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium text-blue-600 transition-colors hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>

        {/* Info Box */}
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex">
            <svg className="flex-shrink-0 w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Your email will be used as your login ID. After registration, you can login using your email and password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;