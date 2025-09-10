const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://51.21.152.33:5000/api';

// Types pour les réponses API
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  avatar?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: User;
  createdBy: User;
  project: User | string; // Peut être un objet User ou un ID string
  estimatedTime?: number;
  actualTime?: number;
  completedAt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'employee' | 'manager';
}

interface CreateTaskData {
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  project: string; // ID du projet
  estimatedTime?: number;
  tags?: string[];
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  estimatedTime?: number;
  status?: 'todo' | 'in-progress' | 'completed';
  completedAt?: string;
  tags?: string[];
}

// Classe pour gérer les appels API
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  // Méthode pour définir le token d'authentification
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Méthode pour supprimer le token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Méthode générique pour les appels API
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    console.log("[API] Appel vers:", url)
    console.log("[API] Token présent:", this.token ? "oui" : "non")
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Ajouter le token d'authentification si disponible
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      console.log("[API] Envoi de la requête avec config:", config)
      const response = await fetch(url, config);
      console.log("[API] Réponse reçue:", response.status, response.statusText)
      const data = await response.json();
      console.log("[API] Données reçues:", data)

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ===== AUTHENTIFICATION =====

  // Connexion
  async login(credentials: LoginData): Promise<{ user: User; token: string; refreshToken: string }> {
    const response = await this.request<{ user: User; token: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  // Inscription
  async register(userData: RegisterData): Promise<{ user: User; token: string; refreshToken: string }> {
    const response = await this.request<{ user: User; token: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  // Déconnexion
  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
    this.clearToken();
  }

  // Obtenir le profil utilisateur
  async getProfile(): Promise<{ user: User }> {
    console.log("[API] Appel getProfile avec token:", this.token ? "présent" : "absent")
    const response = await this.request<{ user: User }>('/auth/me');
    console.log("[API] Réponse getProfile:", response)
    return response.data!;
  }

  // ===== TÂCHES =====

  // Obtenir toutes les tâches
  async getTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    sort?: string;
    order?: string;
  }): Promise<{ tasks: Task[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{ tasks: Task[]; pagination: any }>(endpoint);
    return response.data!;
  }

  // Obtenir une tâche par ID
  async getTask(id: string): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${id}`);
    return response.data!;
  }

  // Créer une nouvelle tâche
  async createTask(taskData: CreateTaskData): Promise<Task> {
    const response = await this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return response.data!;
  }

  // Mettre à jour une tâche
  async updateTask(id: string, updates: UpdateTaskData): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.data!;
  }

  // Supprimer une tâche
  async deleteTask(id: string): Promise<void> {
    await this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Marquer une tâche comme terminée
  async completeTask(id: string, actualTime?: number): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ actualTime }),
    });
    return response.data!;
  }

  // ===== UTILISATEURS (ADMIN) =====
  async getUsers(params: { page?: number; limit?: number; search?: string; role?: string }) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    return this.request<any>(`/users?${query.toString()}`);
  }
  async createUser(data: { name: string; email: string; password: string; role: string }) {
    return this.request<any>(`/users`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  async updateUser(id: string, data: { name: string; email: string; role: string }) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, { method: 'DELETE' });
  }
  async toggleUserStatus(id: string) {
    return this.request<any>(`/users/${id}/toggle-status`, { method: 'PATCH' });
  }

  // ===== STATISTIQUES =====

  // Obtenir les statistiques du dashboard
  async getDashboardStats(): Promise<any> {
    console.log('[API] Appel getDashboardStats')
    const response = await this.request('/stats/dashboard');
    console.log('[API] Réponse getDashboardStats complète:', response)
    console.log('[API] Données extraites:', response.data)
    return response.data;
  }

  // Obtenir les analyses des tâches
  async getTaskAnalytics(period: string = 'month'): Promise<any> {
    console.log('[API] Appel getTaskAnalytics avec période:', period)
    const response = await this.request(`/stats/tasks?period=${period}`);
    console.log('[API] Réponse getTaskAnalytics complète:', response)
    console.log('[API] Données extraites:', response.data)
    return response.data;
  }

  // Obtenir les performances des utilisateurs (pour managers/admins)
  async getUserPerformance(period: string = 'month'): Promise<any> {
    const response = await this.request(`/stats/users/performance?period=${period}`);
    return response.data;
  }

  // Obtenir les statistiques d'équipe (pour managers/admins)
  async getTeamStats(): Promise<any> {
    const response = await this.request('/stats/team');
    return response.data;
  }

  // ===== GESTION DES ERREURS =====

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Obtenir le token actuel
  getToken(): string | null {
    return this.token;
  }
}

// Instance singleton
const apiService = new ApiService();

export default apiService;
export type { User, Task, LoginData, RegisterData, CreateTaskData }; 