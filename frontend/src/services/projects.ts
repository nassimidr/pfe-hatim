import apiService from './api';

export const createProject = async (name: string, description: string, membersEmails: string[]) => {
  return apiService.request('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description, membersEmails })
  });
};

export const addMemberToProject = async (projectId: string, email: string) => {
  return apiService.request(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

export const listProjectMembers = async (projectId: string) => {
  return apiService.request(`/projects/${projectId}/members`);
};

export const createProjectTask = async (
  projectId: string,
  title: string,
  description: string,
  assignedTo: string,
  dueDate: string,
  priority: string
) => {
  return apiService.request(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      description,
      assignedTo,
      dueDate,
      priority
    })
  });
};

export const getProjectTasks = async (projectId: string) => {
  return apiService.request(`/projects/${projectId}/tasks`);
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  return apiService.request(`/projects/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

export const getUserProjects = async () => {
  return apiService.request('/projects');
}; 