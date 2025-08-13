import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import LoginScreen from './LoginScreen';
import App from '../App';

export default function ProtectedApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('pv_auth');
        if (!authData) {
          setIsChecking(false);
          return;
        }

        const parsed = JSON.parse(authData);
        const now = Date.now();

        // Check if authentication is still valid
        if (parsed.authenticated && parsed.expires && now < parsed.expires) {
          setIsAuthenticated(true);
        } else {
          // Clear expired auth
          localStorage.removeItem('pv_auth');
        }
      } catch (error) {
        // Clear invalid auth data
        localStorage.removeItem('pv_auth');
      }
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  // Show loading state briefly while checking auth
  if (isChecking) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  // Show main app if authenticated
  return <App />;
}