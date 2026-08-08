import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

// Auth
export const login = async (email, password) => (await api.post('/auth/login', { email, password })).data;
export const getCurrentUser = async () => (await api.get('/auth/me')).data;
export const getUsers = async () => (await api.get('/auth/users')).data;
export const inviteUser = async (data) => (await api.post('/auth/invite', data)).data;
export const createUser = async (data) => (await api.post('/auth/register', data)).data;
export const updateUser = async (id, data) => (await api.put(`/auth/users/${id}`, data)).data;
export const deleteUser = async (id) => (await api.delete(`/auth/users/${id}`)).data;

// Fornecedores
export const getFornecedores = async (params = {}) => (await api.get('/fornecedores', { params })).data;
export const getFornecedor = async (id) => (await api.get(`/fornecedores/${id}`)).data;
export const createFornecedor = async (data) => (await api.post('/fornecedores', data)).data;
export const updateFornecedor = async (id, data) => (await api.put(`/fornecedores/${id}`, data)).data;
export const deleteFornecedor = async (id) => (await api.delete(`/fornecedores/${id}`)).data;
export const uploadNF = async (id, file) => {
  const formData = new FormData();
  formData.append('nf', file);
  return (await api.post(`/fornecedores/${id}/nf`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};
export const deleteNF = async (id) => (await api.delete(`/fornecedores/${id}/nf`)).data;
export const updatePagamento = async (id, data) => (await api.patch(`/fornecedores/${id}/pagamento`, data)).data;

// Eventos
export const getEventos = async (params = {}) => (await api.get('/eventos', { params })).data;
export const getEvento = async (id) => (await api.get(`/eventos/${id}`)).data;
export const createEvento = async (data) => (await api.post('/eventos', data)).data;
export const updateEvento = async (id, data) => (await api.put(`/eventos/${id}`, data)).data;
export const deleteEvento = async (id) => (await api.delete(`/eventos/${id}`)).data;

// Dashboard
export const getDashboard = async () => (await api.get('/dashboard')).data;

export default api;
