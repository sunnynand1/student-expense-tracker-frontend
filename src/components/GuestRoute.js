import { Navigate, useLocation } from 'react-router-dom';

export default function GuestRoute({ children }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAuthenticated = user && user.token;
  const { from } = location.state || { from: { pathname: '/dashboard' } };

  if (isAuthenticated) {
    // If user is authenticated, redirect them to the dashboard or the page they were trying to access
    return <Navigate to={from} replace />;
  }

  return children;
}
