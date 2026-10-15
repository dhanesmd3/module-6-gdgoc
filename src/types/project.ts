export interface Project {
  id: number;
  title: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl: string;
  ownerId: number | null;
}

export type ProjectInput = Omit<Project, 'id' | 'ownerId'>;
