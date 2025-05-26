import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI, setNavigate } from '../../services/api';
import api from '../../services/api';

export default function LoginForm() {
  const navigate = useNavigate();
  
  // Set up navigation for API service
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        throw new Error('Please enter both email and password');
      }

      // Show loading state
      setSuccess('Connecting to server...');

      const response = await authAPI.login(
        formData.email.trim().toLowerCase(),
        formData.password
      );

      if (!response?.data) {
        throw new Error('Invalid response from server');
      }

      if (!response.data.token) {
        throw new Error('No authentication token received from server');
      }

      // Store user data and token in localStorage
      const userData = {
        ...(response.data.user || {}),
        token: response.data.token,
        refreshToken: response.data.refreshToken || ''
      };
      
      console.log('Storing user data in localStorage', userData);
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastLogin', Date.now().toString());
      
      // Set the default authorization header for all future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      // Verify token is properly set
      console.log('Authorization header set:', api.defaults.headers.common['Authorization']);
      
      // Make a test request to /auth/me to verify authentication works
      try {
        const meResponse = await authAPI.getMe();
        console.log('Authentication verified:', meResponse.data);
      } catch (verifyError) {
        console.warn('Could not verify authentication:', verifyError);
        // Continue anyway since login was successful
      }
      
      setSuccess('Login successful! Redirecting...');
      
      // Redirect to dashboard after a short delay to show success message
      const redirectTimer = setTimeout(() => {
        console.log('Navigating to /dashboard');
        navigate('/dashboard', { replace: true });
      }, 1000);
      
      // Cleanup the timer if the component unmounts
      return () => clearTimeout(redirectTimer);
    } catch (err) {
      // Enhanced error logging
      console.group('Login Error Details');
      console.log('Error object:', err);
      console.log('Error message:', err.message);
      console.log('Error name:', err.name);
      console.log('Error stack:', err.stack);
      
      if (err.response) {
        // The request was made and the server responded with a status code
        console.log('Response status:', err.response.status);
        console.log('Response headers:', err.response.headers);
        console.log('Response data:', err.response.data);
      } else if (err.request) {
        // The request was made but no response was received
        console.log('Request made but no response received');
        console.log('Request:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error setting up the request:', err.message);
      }
      
      console.log('Config:', err.config);
      console.groupEnd();
      
      let errorMessage = 'An error occurred during login. Please try again.';
      
      // Safely handle error message extraction
      let errorMsg = 'Unknown error';
      
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else if (err && typeof err.toString === 'function') {
        errorMsg = err.toString();
      }
      
      if (errorMsg && errorMsg.includes && errorMsg.includes('Network Error')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.response) {
        // Server responded with an error status code
        const status = err.response.status;
        const responseData = err.response.data || {};
        
        switch (status) {
          case 400:
            errorMessage = responseData.message || 'Invalid request. Please check your input and try again.';
            break;
          case 401:
            errorMessage = responseData.message || 'Invalid email or password. Please try again.';
            break;
          case 403:
            errorMessage = responseData.message || 'Access denied. Please contact support.';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later or contact support if the problem persists.';
            break;
          default:
            errorMessage = responseData.message || errorMessage;
        }
      } else {
        errorMessage = errorMsg || errorMessage;
      }
      
      setError(errorMessage);
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don't have an account?
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/signup"
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
