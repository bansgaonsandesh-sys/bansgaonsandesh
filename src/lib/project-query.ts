/**
 * Database Query Helpers for Multi-Tenant System
 * Automatically adds project_id filter to all queries
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentProjectId, ProjectId } from '@/config/projects'

export interface QueryOptions {
  projectId?: ProjectId
  skipProjectFilter?: boolean
}

/**
 * Get project ID for queries
 * Uses provided projectId or falls back to current project
 */
export function getQueryProjectId(options?: QueryOptions): ProjectId {
  if (options?.skipProjectFilter) {
    throw new Error('Project filter is required for this query')
  }
  return options?.projectId || getCurrentProjectId()
}

/**
 * Add project filter to Supabase query builder
 */
export function withProjectFilter<T>(
  query: any,
  options?: QueryOptions
): any {
  if (options?.skipProjectFilter) {
    return query
  }
  
  const projectId = getQueryProjectId(options)
  return query.eq('project_id', projectId)
}

/**
 * Query builder helpers with automatic project filtering
 */
export class ProjectQueryBuilder {
  constructor(
    private supabase: SupabaseClient,
    private projectId: ProjectId = getCurrentProjectId()
  ) {}

  /**
   * Select from table with project filter
   */
  from(table: string) {
    return {
      select: (columns = '*', options?: { skipProjectFilter?: boolean }) => {
        const query = this.supabase.from(table).select(columns)
        return options?.skipProjectFilter 
          ? query 
          : query.eq('project_id', this.projectId)
      },
      
      insert: (data: any | any[]) => {
        const records = Array.isArray(data) ? data : [data]
        const recordsWithProject = records.map(record => ({
          ...record,
          project_id: this.projectId,
        }))
        return this.supabase
          .from(table)
          .insert(recordsWithProject)
      },
      
      update: (data: any) => {
        return this.supabase
          .from(table)
          .update(data)
          .eq('project_id', this.projectId)
      },
      
      delete: () => {
        return this.supabase
          .from(table)
          .delete()
          .eq('project_id', this.projectId)
      },
    }
  }

  /**
   * Change project context
   */
  useProject(projectId: ProjectId) {
    return new ProjectQueryBuilder(this.supabase, projectId)
  }
}

/**
 * Create a project-aware query builder
 */
export function createProjectQuery(
  supabase: SupabaseClient,
  projectId?: ProjectId
): ProjectQueryBuilder {
  return new ProjectQueryBuilder(supabase, projectId || getCurrentProjectId())
}

/**
 * Middleware to add project_id to insert/update operations
 */
export function addProjectId<T extends Record<string, any>>(
  data: T,
  projectId?: ProjectId
): T & { project_id: ProjectId } {
  return {
    ...data,
    project_id: projectId || getCurrentProjectId(),
  }
}

/**
 * Batch add project_id to multiple records
 */
export function addProjectIdBatch<T extends Record<string, any>>(
  records: T[],
  projectId?: ProjectId
): (T & { project_id: ProjectId })[] {
  const pid = projectId || getCurrentProjectId()
  return records.map(record => addProjectId(record, pid))
}
