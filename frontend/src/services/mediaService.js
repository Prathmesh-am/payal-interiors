import axios from "axios";
import { apiClient } from "./blogService";

export const fetchMedia = async () => {
  try {
    const response = await apiClient.get('/media');
    return response.data;
  } catch (error) {
    console.error("Error fetching media:", error);
    throw error;
  }
};
export const uploadMedia = async (file, tags, title, description, altText) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (tags) formData.append('tags', tags);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (altText) formData.append('altText', altText);
    const response = await axios.post(`${apiClient.defaults.baseURL}/media/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
};
