# Multi-Project Access System

## Overview
This system allows users to access multiple projects (bansgaonsandesh and nextupdate) with a single account, since both projects share the same Supabase authentication system.

## Database Structure

### user_projects Table
```sql
CREATE TABLE user_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);
```

**Purpose**: Many-to-many relationship between users and projects
- `user_id`: References the Supabase auth user
- `project_id`: Either 'bansgaonsandesh' or 'nextupdate'
- `is_active`: Whether the user can currently access this project
- Unique constraint prevents duplicate assignments

## Admin Management

### User Management Interface
Location: `/src/app/admin/users/page.tsx`

**Features**:
1. **Multi-Select Projects**: Admins can assign users to multiple projects
2. **Visual Project Tags**: Table shows all projects a user has access to
3. **Project Filtering**: Filter users by their project access
4. **Automatic Assignment**: New users are automatically added to user_projects table

### Key Functions

#### `manageUserProjects(userId, projectIds[], accessToken)`
Location: `/src/app/actions/userActions.ts`

**Purpose**: Manages project assignments for a user
**Process**:
1. Verifies admin authentication
2. Deletes all existing user_projects for the user
3. Inserts new project assignments
4. Returns success/error status

**Usage**:
```typescript
const result = await manageUserProjects(
  userId,
  ['bansgaonsandesh', 'nextupdate'],
  accessToken
)
```

## How It Works

### Creating a New User
1. Admin creates user via "Create New User" form
2. `adminCreateUser()` creates the auth user and profile
3. `manageUserProjects()` adds the user to selected project(s)
4. User receives invitation email

### Editing User Projects
1. Admin clicks "Edit" on a user
2. Form shows multi-select with user's current projects
3. Admin can add/remove projects
4. On save:
   - Profile is updated via `adminUpdateUser()`
   - Projects are updated via `manageUserProjects()`

### Querying Users
Fetch users with their projects:
```typescript
const { data } = await supabaseClient
  .from('profiles')
  .select('*, cities(*), user_projects(project_id, is_active)')
  .order('created_at', { ascending: false })
```

### Filtering by Project
```typescript
const filteredUsers = users.filter(user => {
  const matchesProject = projectFilter === 'all' || 
    user.user_projects?.some(up => up.is_active && up.project_id === projectFilter)
  return matchesProject
})
```

## Data Migration

All existing users were migrated from the single `project_id` field in profiles to the `user_projects` table:

```sql
INSERT INTO user_projects (user_id, project_id, is_active)
SELECT id, project_id, true
FROM profiles
WHERE project_id IS NOT NULL;
```

**Result**: 102 users migrated
- 3 bansgaonsandesh users
- 99 nextupdate users

## Benefits

1. **Single Account**: Users can access both projects with one email/password
2. **Flexible Access**: Admins can grant/revoke access to specific projects
3. **No Duplication**: Email addresses remain unique across the system
4. **Easy Management**: Simple UI to manage multi-project access
5. **Scalable**: Easy to add more projects in the future

## Future Enhancements

1. **Project Switching**: Add UI for users to switch between projects
2. **Default Project**: Set a default landing project for users
3. **Project-Specific Roles**: Different roles per project
4. **Activity Tracking**: Track which project user is currently active in
5. **Permissions**: Granular permissions per project

## Technical Notes

- `profiles.project_id` is kept for backward compatibility
- `user_projects` is the source of truth for project access
- Filters check `user_projects` table, not `project_id` field
- New users must have at least one project assigned
- Edit form requires at least one project selection
