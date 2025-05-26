import axios from 'axios';
import { toast } from 'react-toastify';

// Use environment variable or default to relative path (proxy handles the base URL in development)
const API_URL = "https://student-expense-tracker-backend.onrender.com/api";

// Navigation will be handled by React Router's useNavigate hook
let navigate = null;

const setNavigate = (navigateFn) => {
  navigate = navigateFn;
};

// Function to get the auth token
const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.token || '';
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
    'X-Requested-With': 'XMLHttpRequest' // Helps some frameworks identify AJAX requests
  },
  timeout: 10000, // 10 seconds timeout
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Handle network errors
const handleNetworkError = (error) => {
  if (error.message === 'Network Error') {
    return Promise.reject(new Error('Unable to connect to the server. Please check your connection and try again.'));
  }
  return Promise.reject(error);
};

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
    
    return config;

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
        
        // Try to refresh the token, sending the current token in multiple ways
        const response = await api.post('/auth/refresh-token', { token: currentToken }, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'x-auth-token': currentToken
          }
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
      return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection and try again.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', {
        message: error.message,
        stack: error.stack,
        config: error.config
      });
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
  
  register: (userData) => api.post('/auth/register', userData, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: true
  }),
  
  getMe: () => api.get('/auth/me', {
    withCredentials: true
  }),
  
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

// Export the API instance and other utilities
export { setNavigate };
export default api;
