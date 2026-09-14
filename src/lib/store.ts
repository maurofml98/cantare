import { User, Project } from './types';

const STORAGE_KEYS = {
  USER: 'cantare:user',
  PROJECTS: 'cantare:projects',
  WARMUPS: 'cantare:warmups'
};

export const store = {
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: User) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  clearUser: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  getProjects: (): Project[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },
  saveProjects: (projects: Project[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },
  addProject: (project: Project) => {
    const projects = store.getProjects();
    store.saveProjects([project, ...projects]);
  },
  updateProject: (project: Project) => {
    const projects = store.getProjects();
    const updated = projects.map(p => p.id === project.id ? project : p);
    store.saveProjects(updated);
  },
  deleteProject: (id: string) => {
    const projects = store.getProjects();
    store.saveProjects(projects.filter(p => p.id !== id));
  }
};