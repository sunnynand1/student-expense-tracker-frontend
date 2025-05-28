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
  const [rememberMe, setRememberMe] = useState(false);

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
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <button className="text-sm font-medium text-gray-500 bg-gray-100 py-1 px-3 rounded-full mb-8">
              Create
            </button>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Create an account</h1>
            <p className="text-sm text-gray-500">Let's get you all set up for your expenses</p>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="username@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-400 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-yellow-500 hover:text-yellow-600">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Signing in...' : 'Submit'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 flex justify-center items-center space-x-4">
            <button className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-50">
              <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.163 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.934.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.16 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-50">
              <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
              </svg>
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-50">
              <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 14-7.503 14-14 0-.21-.005-.42-.014-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z" />
              </svg>
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-yellow-500 hover:text-yellow-600">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Right side - Image and info */}
      <div className="hidden md:block md:w-1/2 bg-white p-8 relative">
        <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          We handle your money with care
        </div>
        
        <div className="h-full flex flex-col justify-center items-center">
          <div className="relative w-full max-w-md">
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
              alt="Students managing expenses"
              className="w-full h-auto rounded-xl shadow-lg"
            />
            
            <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <img className="w-8 h-8 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/women/12.jpg" alt="User" />
                  <img className="w-8 h-8 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
                  <img className="w-8 h-8 rounded-full border-2 border-white" src="https://randomuser.me/api/portraits/women/45.jpg" alt="User" />
                </div>
                <span className="text-sm font-medium">Join 2,500+ students</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Student Expense Tracker</h2>
            <p className="text-gray-600">
              Take control of your finances with our easy-to-use expense tracker designed specifically for students.
              Track spending, set budgets, and achieve your financial goals.
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-8 right-8 flex justify-between text-xs text-gray-500">
          <span>Privacy Policy</span>
          <span>Terms & Conditions</span>
        </div>
      </div>
    </div>
  );
}
