const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const authAPI = {
  register: async (name, username, email, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Registration failed");
    return data;
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  getProfile: async (token) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch profile");
    return await response.json();
  },

  logout: async (token) => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
    } catch (err) {
      console.log("Logout API call error:", err);
    }
  },
};

export const userAPI = {
  search: async (username, token) => {
    const response = await fetch(`${API_URL}/auth/search?username=${encodeURIComponent(username)}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Search failed");
    return data;
  },
  updateProfile: async (updates, token) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },
  changePassword: async (oldPassword, newPassword, token) => {
    const response = await fetch(`${API_URL}/auth/profile/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },
};

export const privateChatAPI = {
  create: async (username, token) => {
    const response = await fetch(`${API_URL}/chats/private`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to create chat");
    return data;
  },
};

export const chatAPI = {
  getChats: async (token) => {
    const response = await fetch(`${API_URL}/chats`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch chats");
    return data;
  },

  getMessages: async (chatId, token) => {
    const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to load messages");
    return data;
  },

  sendMessage: async (chatId, text, token) => {
    const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to send message");
    return data;
  },
};

export const storage = {
  setToken: (token) => localStorage.setItem("auth_token", token),
  getToken: () => localStorage.getItem("auth_token"),
  setUser: (user) => localStorage.setItem("current_user", JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem("current_user");
    return user ? JSON.parse(user) : null;
  },
  clear: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
  },
};
