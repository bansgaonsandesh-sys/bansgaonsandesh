/**
 * Multi-Tenant Project Configuration
 * Manages multiple projects using the same database
 * 
 * PROJECT TYPES:
 * - Next Update: Social platform - anyone can register and post
 * - Bansgaon Sandesh: News agency - only admin-created users can post
 */

export type ProjectId = 'nextupdate' | 'bansgaonsandesh'

export interface ProjectConfig {
  id: ProjectId
  name: string
  domain: string
  description: string
  url: string
  isActive: boolean
}

// Available projects
export const PROJECTS: Record<ProjectId, ProjectConfig> = {
  nextupdate: {
    id: 'nextupdate',
    name: 'Next Update',
    domain: 'nextupdate.com',
    description: 'Connect, share, and earn points in your city',
    url: 'https://nextupdate.com',
    isActive: true,
  },
  bansgaonsandesh: {
    id: 'bansgaonsandesh',
    name: 'Bansgaon Sandesh',
    domain: 'bansgaonsandesh.com',
    description: 'Local news and updates for Bansgaon',
    url: 'https://bansgaonsandesh.com',
    isActive: true,
  },
}

// Get current project based on environment or default
export function getCurrentProjectId(): ProjectId {
  // Check environment variable first
  const envProjectId = process.env.NEXT_PUBLIC_PROJECT_ID as ProjectId
  if (envProjectId && PROJECTS[envProjectId]) {
    return envProjectId
  }
  
  // Default to bansgaonsandesh (this project)
  return 'bansgaonsandesh'
}

// Get current project configuration
export function getCurrentProject(): ProjectConfig {
  return PROJECTS[getCurrentProjectId()]
}

// Check if project ID is valid
export function isValidProjectId(projectId: string): projectId is ProjectId {
  return projectId in PROJECTS
}

/**
 * Get project IDs for post filtering
 * BUSINESS RULE:
 * - Bansgav Sandesh: Shows posts from BOTH bansgaonsandesh AND nextupdate
 * - NextUpdate: Shows ONLY nextupdate posts
 */
export function getPostProjectFilter(currentProjectId?: ProjectId): ProjectId[] {
  const projectId = currentProjectId || getCurrentProjectId()
  
  if (projectId === 'bansgaonsandesh') {
    // Bansgav Sandesh users see posts from both projects
    return ['bansgaonsandesh', 'nextupdate']
  }
  
  // NextUpdate users only see NextUpdate posts
  return ['nextupdate']
}

// Get project by domain (useful for multi-domain deployments)
export function getProjectByDomain(domain: string): ProjectConfig | null {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '')
  
  for (const project of Object.values(PROJECTS)) {
    if (project.domain.toLowerCase() === normalizedDomain) {
      return project
    }
  }
  
  return null
}

// Helper to get project-specific configuration
export function getProjectConfig(projectId?: ProjectId): ProjectConfig {
  if (projectId && isValidProjectId(projectId)) {
    return PROJECTS[projectId]
  }
  return getCurrentProject()
}
