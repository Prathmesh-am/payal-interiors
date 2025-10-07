import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 8000, // 8 seconds timeout
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const fetchBlogs = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/blogs', {
      params: { page, limit },
    });
    if (!response.data) {
      throw new Error('No blogs data received.');
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw error;
  }
};

export const fetchBlogById = async (id) => {
  try {
    const response = await apiClient.get(`/blogs/${id}`);
    if(!response){
      throw new Error('No blog data received.');
    }
    return response.data.blog;
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    throw error;
  }
};

export const createBlog = async (blogData) => {
  try {
    console.log(blogData);

    const response = await axios.post(`${API_URL}/blogs`, blogData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating blog:", error);
    throw error;
  }
};


export const updateBlog = async (id, blogData) => {
  try {
    const response = await apiClient.put(`/blogs/${id}`, blogData);
    return response.data;
  } catch (error) {
    console.error("Error updating blog:", error);
    throw error;
  }
};
export const deleteBlog = async (id) => {
  try {
    const response = await apiClient.delete(`/blogs/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await apiClient.get('/categories');
    return response.data.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};
