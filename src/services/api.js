import axios from 'axios';
import { toast } from 'react-toastify';

// Use environment variable or default to local development server
// In development, connect to the local backend server
// In production, use the remote server
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Define multiple potential backend URLs to try
const BACKEND_URLS = {
  development: 'http://localhost:5000/api',
  production: [
    'https://student-expense-tracker-backend.onrender.com/api',
    'https://student-expense-tracker-backend.herokuapp.com/api', // Fallback if you have a Heroku deployment
    'https://student-expense-tracker-backend-sunnynand1.onrender.com/api' // Another possible Render URL format
  ]
};

// Use the appropriate URL based on environment
const API_URL = isDevelopment 
  ? BACKEND_URLS.development 
  : BACKEND_URLS.production[0]; // Start with the first production URL

console.log(`Using API URL: ${API_URL} (${isDevelopment ? 'development' : 'production'} mode)`);

// Function to test backend connectivity and switch to fallback if needed
const testBackendConnectivity = async () => {
  if (isDevelopment) return; // Skip in development mode
  
  try {
    // Try the primary URL first
    await axios.get(BACKEND_URLS.production[0], { timeout: 5000 });
    console.log('Primary backend is accessible');
  } catch (error) {
    console.warn('Primary backend is not accessible, trying fallbacks...');
    
    // Try fallback URLs
    for (let i = 1; i < BACKEND_URLS.production.length; i++) {
      try {
        await axios.get(BACKEND_URLS.production[i], { timeout: 5000 });
        console.log(`Switching to fallback backend: ${BACKEND_URLS.production[i]}`);
        // Update the API_URL to use the working fallback
        api.defaults.baseURL = BACKEND_URLS.production[i];
        return;
      } catch (fallbackError) {
        console.warn(`Fallback ${i} is also not accessible`);
      }
    }
    
    // If all backends are inaccessible, show a user-friendly message
    console.error('All backend servers are currently unavailable');
    toast.error('Backend services are currently unavailable. Please try again later.');
  }
};


// Navigation will be handled by React Router's useNavigate hook
let navigate = null;

const setNavigate = (navigateFn) => {
  navigate = navigateFn;
};

// Function to get the auth token
const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user?.token || '';
    if (token) {
      console.log('Retrieved token from localStorage:', `${token.substring(0, 10)}...`);
    } else {
      console.warn('No token found in localStorage');
    }
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return '';
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies, authorization headers with HTTPS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Helps some frameworks identify AJAX requests
    // In development, we need to be more permissive with CORS
    'Access-Control-Allow-Origin': isDevelopment ? '*' : undefined,
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  },
  timeout: 15000, // 15 seconds timeout for better reliability
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Test backend connectivity and switch to fallback if needed
// We call this immediately when the application loads
testBackendConnectivity().catch(error => {
  console.error('Error testing backend connectivity:', error);
});

// Network error handling is now done in the response interceptor

// Helper function to handle forced logout
const forceLogout = () => {
  console.log('Forcing logout due to authentication failure');
  localStorage.removeItem('user');
  localStorage.removeItem('lastLogin');
  
  // Redirect to login if we have access to navigate
  if (navigate) {
    navigate('/login', { 
      state: { 
        from: window.location.pathname,
        message: 'Your session has expired. Please login again.'
      },
      replace: true 
    });
  } else {
    // If we can't navigate, at least redirect to login
    window.location.href = '/login';
  }
};

// Single request interceptor to handle all requests
api.interceptors.request.use(
  (config) => {
    console.log('[API Request]', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
      withCredentials: config.withCredentials
    });
    
    // Skip adding auth header for login/register requests
    const publicEndpoints = ['/auth/login', '/auth/register'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url.endsWith(endpoint)
    );

    // Add auth token for non-public endpoints
    if (!isPublicEndpoint) {
      const token = getAuthToken();
      if (token) {
        // Ensure headers object exists
        config.headers = config.headers || {};
        // Set the Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('No auth token available for protected endpoint:', config.url);
      }
    }
    
    // Ensure credentials are included for all requests
    config.withCredentials = true;
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime()
      };
    }

    // Log the request
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    console.log('[API Response]', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  async (error) => {
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      code: error.code,
      message: error.message,
      config: error.config
    });

    // Handle network errors (like when the backend is down)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
      // Try to switch to a fallback backend URL
      if (!isDevelopment) {
        // Find the current URL index
        const currentUrl = error.config?.baseURL || API_URL;
        const currentIndex = BACKEND_URLS.production.indexOf(currentUrl);
        
        // If we have more fallbacks to try
        if (currentIndex < BACKEND_URLS.production.length - 1) {
          const nextUrl = BACKEND_URLS.production[currentIndex + 1];
          console.log(`Switching to fallback backend: ${nextUrl}`);
          
          // Update the API base URL
          api.defaults.baseURL = nextUrl;
          
          // Retry the request with the new URL
          if (error.config) {
            error.config.baseURL = nextUrl;
            return api(error.config);
          }
        } else {
          // We've tried all backends
          toast.error('Backend services are currently unavailable. Please try again later.');
        }
      } else {
        // In development, just show a message
        toast.error('Cannot connect to the backend server. Make sure your local backend is running.');
      }
      
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Handle token expiration (401) and avoid infinite loops
    if (error.response?.status === 401 && 
        originalRequest && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh-token')) {
      
      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;
      
      try {
        console.log('Token expired, attempting to refresh...');
        
        // Get current token to send with refresh request
        const currentToken = getAuthToken();
        
        if (!currentToken) {
          console.warn('No token available for refresh, forcing logout');
          forceLogout();
          return Promise.reject(new Error('Authentication failed'));
        }
        
        console.log('Attempting to refresh token with current token:', currentToken ? `${currentToken.substring(0, 10)}...` : 'none');
        
        // Try to refresh the token, sending the current token in the Authorization header
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          },
          withCredentials: true // Ensure cookies are sent
        });
        
        if (response.data?.token) {
          console.log('Token refreshed successfully');
          
          // Update token in localStorage
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.token = response.data.token;
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update Authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error('No token received in refresh response');
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        forceLogout();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Handle 401 Unauthorized (when refresh token also fails)
      if (error.response.status === 401) {
        console.log('Authentication failed, forcing logout...');
        forceLogout();
      } else if (error.response.status === 403) {
        console.warn('Permission denied:', error.response.data?.message);
      } else if (error.response.status === 404) {
        console.warn('Resource not found:', error.response.data?.message);
      } else if (error.response.status >= 500) {
        console.error('Server error:', error.response.data?.message);
      } else {
        // Log error message from server if available
        const errorMessage = error.response.data?.message || `Request failed with status ${error.response.status}`;
        console.error(errorMessage);
      }
      
      return Promise.reject(error.response.data || new Error(`Request failed with status ${error.response.status}`));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Network Error:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
          withCredentials: error.config?.withCredentials
        }
      });
      console.error('Unable to connect to the server. Please check your internet connection and try again.');
      return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection and try again.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', {
        message: error.message,
        stack: error.stack,
        config: error.config
      });
      console.error('An error occurred while setting up the request.');
      return Promise.reject(new Error('An error occurred while setting up the request.'));
    }
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      const response = await api.post('/auth/login', { email, password }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      console.log('Login response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      // If we get a successful response
      if (response.status >= 200 && response.status < 300) {
        return response;
      }
      
      // For error responses, create a proper error object
      const error = new Error(response.data?.message || 'Login failed');
      error.response = response;
      error.status = response.status;
      throw error;
      
    } catch (error) {
      console.error('Login error details:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack
      });
      
      // If it's an Axios error, extract the useful information
      if (error.isAxiosError) {
        const apiError = new Error(error.response?.data?.message || error.message || 'Login failed');
        apiError.response = error.response;
        apiError.status = error.response?.status;
        throw apiError;
      }
      
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      console.log('Attempting registration with:', { ...userData, password: '***' });
      
      // Add additional headers to help with CORS issues
      const response = await api.post('/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': isDevelopment ? '*' : undefined,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization'
        },
        withCredentials: true,
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      console.log('Registration response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      // If we get a successful response
      if (response.status >= 200 && response.status < 300) {
        toast.success('Account created successfully!');
        return response;
      }
      
      // For error responses, create a proper error object with detailed information
      const error = new Error(response.data?.message || 'Registration failed');
      error.response = response;
      error.status = response.status;
      if (response.data?.errors) {
        error.fieldErrors = response.data.errors;
      }
      throw error;
    } catch (error) {
      console.error('Registration error details:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack
      });
      
      // If it's an Axios error, extract the useful information
      if (error.isAxiosError) {
        const apiError = new Error(error.response?.data?.message || error.message || 'Registration failed');
        apiError.response = error.response;
        apiError.status = error.response?.status;
        throw apiError;
      }
      
      throw error;
    }
  },
  
  getMe: async () => {
    // Get current token
    const token = getAuthToken();
    
    console.log('Making getMe request with token:', token ? `${token.substring(0, 10)}...` : 'none');
    
    return api.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      },
      withCredentials: true
    });
  },
  
  logout: () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    return api.post('/auth/logout', {}, {
      withCredentials: true
    });
  },
};

// Expenses API
export const expensesAPI = {
  getAll: () => api.get('/expenses'),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (expense) => api.post('/expenses', expense),
  update: (id, updates) => api.put(`/expenses/${id}`, updates),
  delete: (id) => api.delete(`/expenses/${id}`)
};

// Budgets API
export const budgetsAPI = {
  getAll: () => api.get('/budgets'),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (budget) => api.post('/budgets', budget),
  update: (id, updates) => api.put(`/budgets/${id}`, updates),
  delete: (id) => api.delete(`/budgets/${id}`)
};

// Documents API
export const documentsAPI = {
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  download: (id) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
  delete: (id) => api.delete(`/documents/${id}`)
};

// Reports API
export const reportsAPI = {
  getReport: (startDate, endDate) => api.get('/reports', {
    params: { startDate, endDate },
    timeout: 15000 // Increase timeout for reports which may take longer to generate
  })
};

// Export the API instance and other utilities
export { setNavigate };
export default api;
