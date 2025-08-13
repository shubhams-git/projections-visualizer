import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Alert, InputAdornment, IconButton,
  Container, Stack, Avatar
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RocketLaunch as RocketLaunchIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

export default function LoginScreen({ onSuccess }) {
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get password from environment variable
  const correctPassword = import.meta.env.VITE_APP_PASSWORD || 'demo123';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple delay to prevent rapid brute force attempts
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === correctPassword) {
      // Store auth state with expiration (24 hours)
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      localStorage.setItem('pv_auth', JSON.stringify(authData));
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(1000px 600px at 120% -10%, ${alpha(theme.palette.primary.main, 0.06)}, transparent 60%), ${theme.palette.background.default}`,
        px: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${alpha('#0f1420', 0.9)}, ${alpha('#0b0e14', 0.9)})`,
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack spacing={3} alignItems="center">
            {/* Brand */}
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <RocketLaunchIcon sx={{ fontSize: 32 }} color="primary" />
            </Avatar>

            <Box textAlign="center">
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Projections Visualizer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter password to access financial projections dashboard
              </Typography>
            </Box>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  error={!!error}
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {error && (
                  <Alert severity="error" variant="outlined">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || !password.trim()}
                  sx={{ py: 1.5 }}
                >
                  {loading ? 'Verifying...' : 'Access Dashboard'}
                </Button>
              </Stack>
            </Box>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Must Login. Authorized access only.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}