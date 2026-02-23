const API_URL = "https://script.google.com/macros/s/AKfycbxGUjRoKUgkoCNGCRWNhOj5Y8-oELP55PXkcMKLTalWzpmSXvtAyO7QQ1kzguJbZIcY/exec";

export const api = {
  request: async (action: string, method: 'GET' | 'POST' = 'GET', payload?: any) => {
    try {
      const options: RequestInit = { method, redirect: "follow" };
      if (method === 'POST') {
        options.headers = { "Content-Type": "text/plain;charset=utf-8" };
        options.body = JSON.stringify({ action, ...payload });
      }
      let url = API_URL;
      if (method === 'GET') {
        url = `${API_URL}?action=${action}`;
        if (payload) {
          const params = new URLSearchParams(payload).toString();
          url += `&${params}`;
        }
      }
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`API Error (${action}):`, error);
      return { status: 'error', message: 'Network request failed.' };
    }
  },

  getVideos: () => api.request('getVideos'),
  getCategories: () => api.request('getCategories'),
  getStore: () => api.request('getStore'),
  getAllUsers: () => api.request('getAllUsers'),
  getUserProfile: (username: string) => api.request('getUserProfile', 'GET', { username }),
  
  login: (username: string, password: string) => api.request('login', 'POST', { username, password }),
  register: (username: string, password: string, nickname: string) => api.request('addUser', 'POST', { username, password, nickname }),
  useToken: (username: string) => api.request('useToken', 'POST', { username }),
  incrementView: (judul: string) => api.request('incrementView', 'POST', { judul }),
  
  updateUser: (data: any) => api.request('adminUpdateUser', 'POST', data),
  deleteVideo: (judul: string) => api.request('deleteVideo', 'POST', { judul }),
  saveVideo: (data: any) => api.request(data.action || 'addVideo', 'POST', data),
  saveStoreItem: (data: any) => api.request(data.action || 'addStoreItem', 'POST', data),
  deleteStoreItem: (name: string, category: string) => api.request('deleteStoreItem', 'POST', { name, category }),
  addCategory: (name: string) => api.request('addCategory', 'POST', { name }),
  deleteCategory: (name: string) => api.request('deleteCategory', 'POST', { name }),

  // TALENT ACTIONS
  getActiveTalents: () => api.request('getActiveTalents'),
  getTalentApps: () => api.request('getTalentApps'),
  getTalentProfile: (username: string) => api.request('getTalentProfile', 'GET', { username }),
  applyTalent: (data: any) => api.request('applyTalent', 'POST', data),
  approveTalent: (username: string) => api.request('approveTalent', 'POST', { username }),
  rejectTalent: (username: string) => api.request('rejectTalent', 'POST', { username }),
  updateTalent: (data: any) => api.request('updateTalent', 'POST', data),
  startChat: (user_username: string, talent_username: string) => api.request('startChat', 'POST', { user_username, talent_username }),
  endChat: (session_id: string) => api.request('endChat', 'POST', { session_id }),
  
  // ADMIN ACTIONS (RIWAYAT, REVENUE & HAPUS PERMANEN)
  getActiveSessions: (username: string) => api.request('getActiveSessions', 'GET', { username }),
  getEndedSessions: () => api.request('getEndedSessions', 'GET'),
  deleteSession: (session_id: string) => api.request('deleteSession', 'POST', { session_id }),
  confirmSalary: (session_id: string) => api.request('confirmSalary', 'POST', { session_id }),
  getAdminBalance: () => api.request('getAdminBalance', 'GET'),
};