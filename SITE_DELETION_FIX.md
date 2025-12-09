# Site Deletion Fix - Complete Summary

## Issue
The delete button was disabled for sites with active permits in the Site Management admin portal, preventing any deletion attempts.

## Root Causes
1. **Frontend UI**: Delete button had `disabled={site.permit_count > 0}` attribute
2. **Frontend Logic**: `handleDeleteSite` function had client-side validation that blocked deletion attempts
3. **Backend Missing Validation**: DELETE endpoint didn't check for permits before soft-deleting
4. **Missing Permit Counts**: GET endpoint didn't include permit counts in the response

## Changes Made

### Backend Changes (`backend/src/routes/sites.routes.js`)

#### 1. Added Permit Count to GET /api/sites (Lines 29-56)
**What**: Updated all three query branches to include permit counts using LEFT JOIN
**Why**: Frontend needs accurate permit counts to display and validate

```javascript
// Before
query = 'SELECT * FROM sites WHERE is_active = TRUE ORDER BY name';

// After
query = `
  SELECT s.*, 
         COUNT(p.id) as permit_count
  FROM sites s
  LEFT JOIN permits p ON s.id = p.site_id
  WHERE s.is_active = TRUE
  GROUP BY s.id
  ORDER BY s.name
`;
```

#### 2. Added Permit Validation to DELETE /api/sites/:id (Lines 264-276)
**What**: Added database check for existing permits before allowing soft delete
**Why**: Enforce business rule that sites with permits cannot be deleted

```javascript
// Check if site has any permits
const [permits] = await pool.query(
  'SELECT COUNT(*) as count FROM permits WHERE site_id = ?', 
  [req.params.id]
);

if (permits[0].count > 0) {
  return res.status(400).json({ 
    success: false, 
    message: `Cannot delete site with ${permits[0].count} existing permit(s). Please close or cancel all permits first.` 
  });
}
```

### Frontend Changes (`frontend/src/pages/admin/SiteManagement.tsx`)

#### 1. Removed Disabled State from Delete Button (Lines 429-435)
**What**: Removed `disabled` attribute and conditional className
**Why**: Allow users to click the button and receive proper error feedback

```tsx
// Before
<button
  disabled={site.permit_count !== undefined && site.permit_count > 0}
  className={`... ${site.permit_count && site.permit_count > 0
    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
    : 'text-red-600 bg-red-50 hover:bg-red-100'
  }`}
>

// After
<button
  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded text-red-600 bg-red-50 hover:bg-red-100"
>
```

#### 2. Removed Client-Side Permit Validation (Lines 241-246)
**What**: Removed the early return when `permit_count > 0`
**Why**: Let backend handle validation and provide consistent error messages

```tsx
// Before
const handleDeleteSite = async (site: Site) => {
  if (site.permit_count && site.permit_count > 0) {
    alert(`Cannot delete site...`);
    return;  // ❌ Blocked here
  }
  // ... rest of function
};

// After
const handleDeleteSite = async (site: Site) => {
  if (!confirm(`Are you sure...`)) return;
  // ... proceeds to backend call
};
```

## How It Works Now

### Scenario 1: Site WITHOUT Permits
1. User clicks Delete button ✅
2. Confirmation dialog appears
3. User confirms
4. Backend checks permit count (0 permits)
5. Backend performs soft delete (sets `is_active = FALSE`)
6. Success message shown
7. Site list refreshes

### Scenario 2: Site WITH Permits
1. User clicks Delete button ✅ (now enabled)
2. Confirmation dialog appears
3. User confirms
4. Backend checks permit count (36 permits)
5. Backend returns 400 error with message: "Cannot delete site with 36 existing permit(s). Please close or cancel all permits first."
6. Error alert shown to user
7. Site is NOT deleted

## Benefits

1. **Better UX**: Users can click the button and receive clear feedback
2. **Consistent Validation**: Backend enforces business rules
3. **Clear Error Messages**: Users know exactly why deletion failed
4. **Data Integrity**: Prevents deletion of sites with active permits
5. **Accurate Display**: Permit counts are now shown correctly

## Testing

### Test Case 1: Delete site without permits
- ✅ Create a new site
- ✅ Attempt to delete it
- ✅ Expected: Site deleted successfully

### Test Case 2: Delete site with permits
- ✅ Select a site with existing permits (e.g., "Amazon BLR7" with 36 permits)
- ✅ Click Delete button (now enabled)
- ✅ Confirm deletion
- ✅ Expected: Error message stating site cannot be deleted due to existing permits

### Test Case 3: Verify permit counts
- ✅ Navigate to Site Management
- ✅ Verify each site shows correct permit count
- ✅ Expected: All sites show "X active permits" badge

## Files Modified
1. `backend/src/routes/sites.routes.js` - Added permit validation and permit counts
2. `frontend/src/pages/admin/SiteManagement.tsx` - Removed disabled state and client-side validation

## Notes
- Deletion is still a "soft delete" (sets `is_active = FALSE`)
- Sites with permits are protected by backend validation
- Error messages are clear and actionable
- The fix maintains data integrity while improving user experience
