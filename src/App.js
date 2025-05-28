import React, { useEffect, useState, Suspense, lazy } from 'react';
import { 
  BrowserRouter as Router,
  Routes, 
  Route, 
  Navigate, 
  Outlet, 
  useLocation,
  useNavigate
} from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertProvider } from './components/ui/Alert';
import Layout from './components/Layout';
import api from './services/api';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Reports = lazy(() => import('./pages/Reports'));
const Documents = lazy(() => import('./pages/Documents'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">We're working on fixing this issue. Please try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Spinner Component
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      if (!isMounted) return;
      
      try {
        const userData = localStorage.getItem('user');
        
        // If no user data, not authenticated
        if (!userData) {
          throw new Error('No user data found');
        }

        const user = JSON.parse(userData);
        
        // If no user token, not authenticated
        if (!user?.token) {
          throw new Error('No authentication token found');
        }
        
        // Set the authorization header for all requests
        api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
        
        // Verify the token with the server
        try {
          const response = await api.get('/auth/me').catch(err => {
            console.error('Error in /auth/me:', err);
            throw err;
          });
          
          if (response?.data?.success) {
            if (isMounted) {
              setIsAuthenticated(true);
              // Update last login time
              localStorage.setItem('lastLogin', Date.now().toString());
              console.log('User authenticated successfully');
            }
          } else {
            throw new Error('Token verification failed');
          }
        } catch (apiError) {
          console.error('API Error during auth check:', {
            error: apiError,
            status: apiError.response?.status,
            data: apiError.response?.data
          });
          
          // If it's a 401 or network error, clear the invalid token
          if (!apiError.response || apiError.response?.status === 401) {
            throw new Error('Session expired');
          }
          throw apiError;
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        if (isMounted) {
          // Only clear user data if it's an authentication error
          if (error.message === 'Session expired' || 
              error.message === 'No authentication token found' ||
              error.message === 'No user data found') {
            localStorage.removeItem('user');
            localStorage.removeItem('lastLogin');
          }
          setIsAuthenticated(false);
          toast.error('Please login to continue');
          navigate('/login', { 
            replace: true,
            state: { from: location.pathname }
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [navigate, location]);

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return isAuthenticated ? children : null;
};

// Custom hook for document title
const useDocumentTitle = (title) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Expense Tracker` : 'Expense Tracker';
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

// Wrapper component for setting document title
const RouteWithTitle = ({ title, element }) => {
  useDocumentTitle(title);
  return element;
};

function App() {
  // Set default document title
  useDocumentTitle('Loading...');

  return (
    <ErrorBoundary>
      <AlertProvider>
        <div className="min-h-screen bg-gray-50">
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={
                  <RouteWithTitle 
                    title="Login" 
                    element={<Login />} 
                  />
                } />
                
                <Route path="/signup" element={
                  <RouteWithTitle 
                    title="Sign Up" 
                    element={<Signup />} 
                  />
                } />
                
                <Route path="/forgot-password" element={
                  <RouteWithTitle 
                    title="Forgot Password" 
                    element={<ForgotPassword />} 
                  />
                } />
                
                <Route path="/reset-password/:token" element={
                  <RouteWithTitle 
                    title="Reset Password" 
                    element={<ResetPassword />} 
                  />
                } />
                
                {/* Protected Routes */}
                <Route element={
                  <PrivateRoute>
                    <Layout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Outlet />
                      </Suspense>
                    </Layout>
                  </PrivateRoute>
                }>
                  <Route path="/dashboard" element={
                    <RouteWithTitle 
                      title="Dashboard" 
                      element={<Dashboard />} 
                    />
                  } />
                  
                  <Route path="/expenses" element={
                    <RouteWithTitle 
                      title="Expenses" 
                      element={<Expenses />} 
                    />
                  } />
                  
                  <Route path="/budgets" element={
                    <RouteWithTitle 
                      title="Budgets" 
                      element={<Budgets />} 
                    />
                  } />
                  
                  <Route path="/reports" element={
                    <RouteWithTitle 
                      title="Reports" 
                      element={<Reports />} 
                    />
                  } />
                  
                  <Route path="/documents" element={
                    <RouteWithTitle 
                      title="Documents" 
                      element={<Documents />} 
                    />
                  } />
                  
                  <Route path="/profile" element={
                    <RouteWithTitle 
                      title="My Profile" 
                      element={<Profile />} 
                    />
                  } />
                  
                  <Route path="/settings/*" element={
                    <RouteWithTitle 
                      title="Settings" 
                      element={<Settings />} 
                    />
                  } />
                  
                  <Route index element={
                    <Navigate to="/dashboard" replace />
                  } />
                </Route>
                
                {/* 404 - Not Found */}
                <Route path="*" element={
                  <RouteWithTitle 
                    title="Page Not Found" 
                    element={<NotFound />} 
                  />
                } />
              </Routes>
            </Suspense>
          </Router>
          
          {/* Toast Container */}
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </AlertProvider>
    </ErrorBoundary>
  );
}

export default App;
