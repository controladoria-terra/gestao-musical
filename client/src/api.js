import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
