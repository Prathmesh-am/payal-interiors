import React, { useState, useContext, useEffect } from 'react';
import { TextField, Button, Typography, Box, Container, Link, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login, register } from '../services/authService';
import { AuthContext } from './../context/AuthContext';

const LoginPage = () => {
  const { isAuthenticated, loading: authLoading, loginUser } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  // React Query mutation for login
  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: () => {
          loginUser();
          navigate('/');
    },
    onError: (error) => setError(error.message || 'Login failed. Please try again.'),
  });

  // React Query mutation for register
  const registerMutation = useMutation({
    mutationFn: () => register(name, email, password),
    onSuccess: () => navigate('/'),
    onError: (error) => setError(error.message || 'Registration failed. Please try again.'),
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/'); // Redirect to homepage if already authenticated
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  if (authLoading) {
    return <CircularProgress />;
  }

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <Container
      maxWidth="sm"
      className="min-h-screen flex items-center justify-center bg-gray-100"
    >
      <Box
        className="p-8 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
        sx={{
          width: '100%',
          maxWidth: 450,
          animation: 'fadeIn 0.5s ease-in-out',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* Placeholder for future SVG image (e.g., logo or illustration) */}
        <Box className="flex justify-center mb-6" sx={{ height: 100 }}>
          {/* Add your SVG here, e.g., <img src="your-logo.svg" alt="Logo" className="h-full" /> */}
        </Box>
        <Typography
          variant="h4"
          className="text-center mb-6 font-bold text-gray-800"
        >
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Typography>
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <TextField
              fullWidth
              label="Full Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin}
              disabled={isLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          )}
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            className="mt-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
            sx={{ textTransform: 'none', fontSize: '1.1rem', fontWeight: 600 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </form>
        <Typography className="text-center mt-6 text-gray-600">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link
            href="#"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline font-medium"
            sx={{ pointerEvents: isLoading ? 'none' : 'auto' }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;