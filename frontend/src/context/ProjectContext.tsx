'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface ProjectWorkspace {
  id: string;
  name: string;
  writeKey: string;
  allowedOrigins: string[];
  isActive: boolean;
  ownerId?: string;
  role: 'owner' | 'editor' | 'viewer';
  createdAt?: string;
}

interface ProjectContextType {
  currentProject: ProjectWorkspace | null;
  projects: ProjectWorkspace[];
  loading: boolean;
  userRole: 'owner' | 'editor' | 'viewer';
  selectProject: (projectId: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  currentProject: null,
  projects: [],
  loading: true,
  userRole: 'owner',
  selectProject: () => {},
  refreshProjects: async () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWorkspace[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/track/projects', {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const fetchedProjects: ProjectWorkspace[] = json.data;
          setProjects(fetchedProjects);

          // Pulihkan project pilihan dari localStorage atau default ke yang pertama
          const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('active_project_id') : null;
          let matched = fetchedProjects.find((p) => p.id === savedProjectId);
          if (!matched && fetchedProjects.length > 0) {
            matched = fetchedProjects[0];
          }

          setCurrentProject(matched || null);
          if (matched && typeof window !== 'undefined') {
            localStorage.setItem('active_project_id', matched.id);
          }
        }
      }
    } catch (err: any) {
      console.warn('[ProjectContext] Gagal memuat daftar project:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selectProject = (projectId: string) => {
    const match = projects.find((p) => p.id === projectId);
    if (match) {
      setCurrentProject(match);
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_project_id', match.id);
      }
    }
  };

  const userRole = currentProject?.role || 'owner';

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loading,
        userRole,
        selectProject,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);

