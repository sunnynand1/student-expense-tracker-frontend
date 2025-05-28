import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

export default function SignupForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({
    username: false,
    name: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const handleBlur = (field) => () => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error && (name === 'confirmPassword' || name === 'password')) {
      setError('');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9]{3,20}$/.test(formData.username)) {
      errors.username = 'Username must be 3-20 alphanumeric characters';
    }

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // If there are any errors, set the general error message to the first one
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      setError(errors[firstErrorField]);
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error and success states
    setError('');
    setSuccess('');
    setFieldErrors({});
    
    // Validate form before submission
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the authAPI service instead of direct fetch
      const userData = {
        username: formData.username.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };
      
      console.log('Submitting registration data:', { ...userData, password: '***' });
      const response = await authAPI.register(userData);

      if (response.data && response.data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setSuccess('Registration successful! You are now logged in. Redirecting...');
        toast.success('Account created successfully!');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error(response.data?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Registration failed. Please try again.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Field validation helpers
  const isUsernameValid = username => username && /^[a-zA-Z0-9]{3,20}$/.test(username);
  const isEmailValid = email => email && /^\S+@\S+\.\S+$/.test(email);
  const isPasswordValid = password => password && password.length >= 6;
  const doPasswordsMatch = (password, confirmPassword) => password === confirmPassword;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left side - Signup form */}
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
            <div className="rounded-md bg-green-50 p-4 mb-4">
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur('username')}
                className={`w-full px-4 py-3 border ${
                  touched.username && !isUsernameValid(formData.username)
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                    : 'border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent'
                } rounded-lg`}
                placeholder="johndoe123"
              />
              {touched.username && !isUsernameValid(formData.username) && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.username || 'Username must be 3-20 alphanumeric characters'}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur('name')}
                className={`w-full px-4 py-3 border ${
                  touched.name && !formData.name.trim()
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                    : 'border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent'
                } rounded-lg`}
                placeholder="John Doe"
              />
              {touched.name && !formData.name.trim() && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.name || 'Full name is required'}</p>
              )}
            </div>

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
                onBlur={handleBlur('email')}
                className={`w-full px-4 py-3 border ${
                  touched.email && !isEmailValid(formData.email)
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                    : 'border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent'
                } rounded-lg`}
                placeholder="username@example.com"
              />
              {touched.email && !isEmailValid(formData.email) && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.email || 'Please enter a valid email address'}</p>
              )}
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
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur('password')}
                  className={`w-full px-4 py-3 border ${
                    touched.password && !isPasswordValid(formData.password)
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                      : 'border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent'
                  } rounded-lg`}
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
              {touched.password && !isPasswordValid(formData.password) && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.password || 'Password must be at least 6 characters'}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur('confirmPassword')}
                  className={`w-full px-4 py-3 border ${
                    touched.confirmPassword && 
                    (formData.confirmPassword || formData.password) && 
                    !doPasswordsMatch(formData.password, formData.confirmPassword)
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                      : 'border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent'
                  } rounded-lg`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {touched.confirmPassword && 
               (formData.confirmPassword || formData.password) && 
               !doPasswordsMatch(formData.password, formData.confirmPassword) && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.confirmPassword || 'Passwords do not match'}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
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
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-yellow-500 hover:text-yellow-600">
                Sign in
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
