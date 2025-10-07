import axios from 'axios';

// Validate environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
if (!API_URL.match(/^https?:\/\/.+/)) {
  throw new Error('Invalid API_URL configuration');
}

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 8000, // 8 seconds timeout
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, 
});

// Basic input validation
const validateInputs = (email, password, name) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  if (name && name.length < 2) {
    throw new Error('Name must be at least 2 characters long');
  }
};

const login = async (email, password) => {
  validateInputs(email, password);
  try {
    const response = await apiClient.post('/user/login', { email, password });
    if (!response) {
      throw new Error('Login failed. No token received.');
    }
    console.log(response);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed. Please try again.';
    throw new Error(message);
  }
};

const register = async (name, email, password) => {
  validateInputs(email, password, name);
  try {
    const response = await apiClient.post('/register', { name, email, password });
     if (!response) {
      throw new Error('Registration failed. No token received.');
    }
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed. Please try again.';
    throw new Error(message);
  }
};
const logout = async () => {
  try {
    const response = await apiClient.post('/user/logout');
    if (!response) {
      throw new Error('Logout failed. No response received.');
    }
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Logout failed. Please try again.';
    throw new Error(message);
  }
};

export { login, register, logout };