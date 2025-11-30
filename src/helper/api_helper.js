import axios from "axios";

const api = axios.create({
  baseURL: process.env.VITE_API_URL || import.meta.env.VITE_API_URL || "http://localhost:4000",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

export const get = async (url, params = {}, headers = {}) => {
  try {
    const response = await api.get(url, {
      params,
      headers
    });
    return response;
  } catch (error) {
    throw handleError(error);
  }
};

export const post = async (url, data = {}, headers = {}) => {
  try {
    const response = await api.post(url, data, {
      headers
    });
    return response;
  } catch (error) {
    throw handleError(error);
  }
};


const handleError = (error) => {
  if (error.response) {
    return {
      message: error.response.data?.message || "Server error",
      status: error.response.status,
      data: error.response
    };
  }

  if (error.request) {
    return {
      message: "No response from server",
      status: null,
      data: null
    };
  }

  return {
    message: error.message,
    status: null,
    data: null
  };
};

export default api;
