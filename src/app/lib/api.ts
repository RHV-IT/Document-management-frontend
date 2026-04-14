const BASE_URL = 'http://localhost:3001/api';

function getToken(): string | null {
  const session = sessionStorage.getItem('rhv_session');
  if (!session) return null;
  try {
    return JSON.parse(session).token;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// AUTH
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ token: string; user: any }>(res);
  },

  me: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: authHeaders(),
    });
    return handleResponse<any>(res);
  },

  updateProfile: async (data: { name: string; email: string }) => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${BASE_URL}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse<any>(res);
  },
};

// DOCUMENTS
export const documentsApi = {
  getAll: async (params?: { type?: string; search?: string; sortBy?: string; sortOrder?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${BASE_URL}/documents${query ? `?${query}` : ''}`, {
      headers: authHeaders(),
    });
    const docs = await handleResponse<any[]>(res);
    return docs.map((d) => ({
      ...d,
      uploadedAt: new Date(d.uploadedAt),
      lastAccessed: new Date(d.lastAccessed),
    }));
  },

  getRecent: async () => {
    const res = await fetch(`${BASE_URL}/documents/recent`, {
      headers: authHeaders(),
    });
    const docs = await handleResponse<any[]>(res);
    return docs.map((d) => ({
      ...d,
      uploadedAt: new Date(d.uploadedAt),
      lastAccessed: new Date(d.lastAccessed),
    }));
  },

  getArchives: async () => {
    const res = await fetch(`${BASE_URL}/documents/archives`, {
      headers: authHeaders(),
    });
    const docs = await handleResponse<any[]>(res);
    return docs.map((d) => ({
      ...d,
      uploadedAt: new Date(d.uploadedAt),
      lastAccessed: new Date(d.lastAccessed),
    }));
  },

  upload: async (
    file: File,
    metadata: { patientId?: string; department: string; description?: string },
    onProgress?: (percent: number) => void
  ) => {
    return new Promise<any>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata.patientId) formData.append('patientId', metadata.patientId);
      formData.append('department', metadata.department);
      if (metadata.description) formData.append('description', metadata.description);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const doc = JSON.parse(xhr.responseText);
          resolve({
            ...doc,
            uploadedAt: new Date(doc.uploadedAt),
            lastAccessed: new Date(doc.lastAccessed),
          });
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));

      xhr.open('POST', `${BASE_URL}/documents/upload`);
      const token = getToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  updateAccess: async (id: string) => {
    const res = await fetch(`${BASE_URL}/documents/${id}/access`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    return handleResponse<any>(res);
  },

  rename: async (id: string, name: string) => {
    const res = await fetch(`${BASE_URL}/documents/${id}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name }),
    });
    return handleResponse<any>(res);
  },

  delete: async (id: string) => {
    const res = await fetch(`${BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<any>(res);
  },
};

// USERS (admin only)
export const usersApi = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: authHeaders(),
    });
    const users = await handleResponse<any[]>(res);
    return users.map((u) => ({ ...u, dateAdded: new Date(u.dateAdded) }));
  },

  create: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    staffId: string;
    role: string;
    department: string;
  }) => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  update: async (id: string, data: { name: string; email: string; staffId: string; role: string; department: string }) => {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  deleteUser: async (id: string) => {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<any>(res);
  },

  toggleStatus: async (id: string) => {
    const res = await fetch(`${BASE_URL}/users/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    return handleResponse<any>(res);
  },
};

// ACTIVITY LOG (admin only)
export const activityApi = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/activity`, {
      headers: authHeaders(),
    });
    const activities = await handleResponse<any[]>(res);
    return activities.map((a) => ({ ...a, timestamp: new Date(a.timestamp) }));
  },
};

// DEPARTMENTS
export const departmentsApi = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/departments`, { headers: authHeaders() });
    return handleResponse<any[]>(res);
  },

  create: async (name: string) => {
    const res = await fetch(`${BASE_URL}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name }),
    });
    return handleResponse<any>(res);
  },

  delete: async (id: string) => {
    const res = await fetch(`${BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return handleResponse<any>(res);
  },
};