import axios from 'axios';

// Resolve backend API URL (Defaults to live Render Cloud backend so both local and online operate seamlessly)
const resolveBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return 'https://rs-gifts-backend.onrender.com/api';
};

// Configured Axios instance
const apiClient = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 60000, // 60s timeout to gracefully accommodate Render cloud cold-starts
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rs_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred';
    if (error.response) {
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.status === 401) {
        errorMessage = 'Unauthorized. Please check admin credentials.';
      } else if (error.response.status === 404) {
        errorMessage = 'Requested resource was not found.';
      } else if (error.response.status === 422 || error.response.status === 400) {
        errorMessage = error.response.data?.errors 
          ? Object.values(error.response.data.errors).flat().join(', ')
          : (error.response.data?.message || 'Validation error');
      }
    } else if (error.request) {
      errorMessage = 'No response from backend server. Operating in local mode.';
    }
    error.formattedMessage = errorMessage;
    return Promise.reject(error);
  }
);

export default apiClient;
