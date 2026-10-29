import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const registerApi = async (account) => {
  const res = await apiClient.post('/auth/register', account);
  return res.data;
};

export const loginApi = async (credentials) => {
  const res = await apiClient.post('/auth/login', credentials);
  return res.data;
};

export const getCurrentUserApi = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

export const logoutApi = async () => {
  const res = await apiClient.post('/auth/logout');
  return res.data;
};

export const getArticlesApi = async () => {
  const res = await apiClient.get('/articles', { params: { status: 'published', limit: 100 } });
  return res.data;
};

export const getArticleApi = async (slug) => {
  const res = await apiClient.get(`/articles/${encodeURIComponent(slug)}`);
  return res.data;
};

export const getCommentsApi = async (articleId) => {
  const res = await apiClient.get(`/articles/${articleId}/comments`);
  return res.data;
};

export const createCommentApi = async (articleId, content) => {
  const res = await apiClient.post(`/articles/${articleId}/comments`, { content });
  return res.data;
};

export const getBookmarksApi = async () => {
  const res = await apiClient.get('/articles/user/bookmarks');
  return res.data;
};

export const toggleBookmarkApi = async (articleId) => {
  const res = await apiClient.post(`/articles/${articleId}/bookmark`);
  return res.data;
};

export const createArticleApi = async (article) => {
  const res = await apiClient.post('/articles', article);
  return res.data;
};

export const deleteArticleApi = async (id) => {
  const res = await apiClient.delete(`/articles/${id}`);
  return res.data;
};

export const updateArticleApi = async (id, article) => {
  const res = await apiClient.patch(`/articles/${id}`, article);
  return res.data;
};

export const getAdminUsersApi = async () => {
  const res = await apiClient.get('/admin/users', { params: { limit: 100 } });
  return res.data;
};

export const updateUserRoleApi = async (userId, role) => {
  const res = await apiClient.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
};

export const generateAiArticleApi = async (articleRequest) => {
  const res = await apiClient.post('/ai/generate', articleRequest, { timeout: 90000 });
  return res.data;
};

export const rewriteAiTextApi = async (text, instruction) => {
  const res = await apiClient.post('/ai/rewrite', { text, instruction }, { timeout: 60000 });
  return res.data;
};

export const getAdminArticlesApi = async () => {
  const res = await apiClient.get('/admin/articles', { params: { limit: 100 } });
  return res.data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const res = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateProfileApi = async (profileData) => {
  const res = await apiClient.patch('/auth/profile', profileData);
  return res.data;
};

export const changePasswordApi = async (passwordData) => {
  const res = await apiClient.post('/auth/change-password', passwordData);
  return res.data;
};
