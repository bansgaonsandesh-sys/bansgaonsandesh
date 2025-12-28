# Testing Multi-Project Access

## What Changed
The create button visibility now checks if the user has access to the 'bansgaonsandesh' project through the `user_projects` table, not just the old `project_id` field.

## How the Logic Works

### Old Logic (Single Project)
```typescript
user?.project_id === 'bansgaonsandesh' ? show : hide
```

### New Logic (Multi-Project)
```typescript
user?.user_projects?.some(up => up.is_active && up.project_id === 'bansgaonsandesh') 
  || user?.project_id === 'bansgaonsandesh' // fallback for backward compatibility
```

## Test Steps

### 1. Test Existing Users (Migration Check)
✅ **Expected**: Create button should still show for users who had `project_id = 'bansgaonsandesh'`
- The migration automatically created entries in `user_projects` table
- Fallback logic `|| user?.project_id === 'bansgaonsandesh'` ensures backward compatibility

### 2. Test New Multi-Project User
1. Go to Admin → Users Management
2. Edit an existing user
3. Select **both** projects: 📰 Bansgaon Sandesh + 🌐 Next Update
4. Save the user
5. Login as that user
6. **Expected**: Create button should appear (since they have bansgaonsandesh access)

### 3. Test nextupdate-Only User
1. Go to Admin → Users Management
2. Edit a user or create new one
3. Select **only** 🌐 Next Update project
4. Save the user
5. Login as that user
6. **Expected**: Create button should NOT appear

### 4. Test Remove bansgaonsandesh Access
1. Edit a user who currently has bansgaonsandesh access
2. Remove bansgaonsandesh from their projects
3. Keep only nextupdate selected
4. Save
5. User needs to refresh/re-login
6. **Expected**: Create button should disappear

## Files Updated

### 1. `/src/lib/providers.tsx`
**Change**: Added `user_projects(project_id, is_active)` to profile query
```typescript
.select('*, cities(name), user_projects(project_id, is_active)')
```

### 2. `/src/components/layout/Sidebar.tsx` (Already updated)
**Change**: Updated condition to check user_projects
```typescript
...(user?.user_projects?.some(up => up.is_active && up.project_id === 'bansgaonsandesh') 
    || user?.project_id === 'bansgaonsandesh' 
    ? [{ key: '/create', icon: PlusCircleOutlined, label: 'Create' }] 
    : [])
```

### 3. `/src/components/layout/AppLayout.tsx` (Already updated)
Same conditional logic as Sidebar

### 4. `/src/hooks/useData.ts` (Already updated)
```typescript
.select('*, cities(name), user_projects(project_id, is_active)')
```

## Troubleshooting

### Create button not showing?
1. **Check if user_projects exists**: 
   - Go to Supabase → SQL Editor
   - Run: `SELECT * FROM user_projects WHERE user_id = 'YOUR_USER_ID'`
   - Should see at least one row with `project_id = 'bansgaonsandesh'`

2. **Check if data is being fetched**:
   - Open browser console
   - Login as the user
   - Check the user object: `console.log(user)`
   - Should see `user_projects: [{ project_id: 'bansgaonsandesh', is_active: true }]`

3. **Force refresh**:
   - Logout
   - Clear browser cache
   - Login again
   - The `providers.tsx` now fetches user_projects on every auth

### Create button showing when it shouldn't?
1. Check if user has bansgaonsandesh in user_projects table
2. Remove bansgaonsandesh project from user in Admin panel
3. User must logout and login again for changes to take effect

## Database Query Reference

### Check user's projects
```sql
SELECT p.name, p.email, up.project_id, up.is_active
FROM profiles p
LEFT JOIN user_projects up ON p.id = up.user_id
WHERE p.email = 'user@example.com';
```

### Add project access
```sql
INSERT INTO user_projects (user_id, project_id, is_active)
VALUES ('user-uuid', 'bansgaonsandesh', true);
```

### Remove project access
```sql
DELETE FROM user_projects 
WHERE user_id = 'user-uuid' AND project_id = 'bansgaonsandesh';
```

## Important Notes

1. **User must re-login** after project changes in admin panel
2. **localStorage cache**: If issues persist, clear browser localStorage
3. **Backward compatibility**: Old `project_id` field still works as fallback
4. **Both projects**: Users with both projects will see create button (since they have bansgaonsandesh)
