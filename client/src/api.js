import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/auth/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/auth/users/${id}`);
  return response.data;
};

// Fornecedores API
export const getFornecedores = async (params = {}) => {
  const response = await api.get('/fornecedores', { params });
  return response.data;
};

export const getFornecedor = async (id) => {
  const response = await api.get(`/fornecedores/${id}`);
  return response.data;
};

export const createFornecedor = async (data) => {
  const response = await api.post('/fornecedores', data);
  return response.data;
};

export const updateFornecedor = async (id, data) => {
  const response = await api.put(`/fornecedores/${id}`, data);
  return response.data;
};

export const deleteFornecedor = async (id) => {
  const response = await api.delete(`/fornecedores/${id}`);
  return response.data;
};

export const uploadNF = async (id, file) => {
  const formData = new FormData();
  formData.append('nf', file);
  const response = await api.post(`/fornecedores/${id}/nf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteNF = async (id) => {
  const response = await api.delete(`/fornecedores/${id}/nf`);
  return response.data;
};

export const updatePagamento = async (id, data) => {
  const response = await api.patch(`/fornecedores/${id}/pagamento`, data);
  return response.data;
};

// Eventos API
export const getEventos = async (params = {}) => {
  const response = await api.get('/eventos', { params });
  return response.data;
};

export const getEvento = async (id) => {
  const response = await api.get(`/eventos/${id}`);
  return response.data;
};

export const createEvento = async (data) => {
  const response = await api.post('/eventos', data);
  return response.data;
};

export const updateEvento = async (id, data) => {
  const response = await api.put(`/eventos/${id}`, data);
  return response.data;
};

export const deleteEvento = async (id) => {
  const response = await api.delete(`/eventos/${id}`);
  return response.data;
};

// Dashboard API
export const getDashboard = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export default api;
