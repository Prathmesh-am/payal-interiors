import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './ProtectedRoutes';
import LoginPage from './pages/LoginPage'; 
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import CreateBlog from './pages/CreateBlog';
import BlogDisplayPage from './pages/DIsplayBlog';
import MediaLibraryPage from './pages/MediaLibrary';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
            <Route path="/create-blog" element={<CreateBlog />} />
            <Route path="/blog/:slug" element={<BlogDisplayPage />} />
            <Route path="media-library" element={<MediaLibraryPage />} />
       
            </Route>
            <Route path="*" element={<h1>404 Not Found</h1>} />
         
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;