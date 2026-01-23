

## Fix: Profile Redirect Loop After Setup

### Problem Identified
The `WelderDashboard` component has a race condition where it redirects to setup before the newly created welder profile data can be fetched. The `useEffect` fires with stale cached data (`welderProfile === null`) before React Query can refetch the updated data.

### Root Cause
```javascript
// WelderDashboard.tsx lines 36-41
useEffect(() => {
  if (!welderLoading && !welderProfile && user) {
    navigate("/welder/profile/setup");  // Fires with stale null data
  }
}, [welderProfile, welderLoading, user, navigate]);
```

### Solution

**1. Fix Query Cache Invalidation in `useCreateWelderProfile`**

Update the `onSuccess` callback to use the correct query key format with the user ID:

```typescript
// src/hooks/useUserProfile.ts
onSuccess: () => {
  // Current: queryClient.invalidateQueries({ queryKey: ["welder_profile"] });
  // Fix to include user ID:
  queryClient.invalidateQueries({ queryKey: ["welder_profile", user?.id] });
}
```

**2. Improve the Dashboard Guard Logic**

Add a short delay or use a state flag to prevent premature redirects while data is being refetched:

```typescript
// src/pages/welder/WelderDashboard.tsx
const [hasInitialLoad, setHasInitialLoad] = useState(false);

useEffect(() => {
  if (!welderLoading) {
    setHasInitialLoad(true);
  }
}, [welderLoading]);

useEffect(() => {
  // Only redirect after initial load completes AND profile is confirmed null
  if (hasInitialLoad && !welderProfile && user && !welderLoading) {
    navigate("/welder/profile/setup");
  }
}, [welderProfile, welderLoading, user, navigate, hasInitialLoad]);
```

**3. Update Profile Setup to Await Cache Refresh**

Modify `WelderProfileSetup.tsx` to ensure the query is refreshed before navigating:

```typescript
const handleSubmit = async () => {
  try {
    await createProfile.mutateAsync({ ... });
    
    // Wait for cache invalidation to complete
    await queryClient.invalidateQueries({ queryKey: ["welder_profile"] });
    
    toast({ ... });
    navigate("/welder/dashboard");
  } catch (err) {
    setError("Failed to create profile. Please try again.");
  }
};
```

**4. Apply Same Fixes to Employer Flow**

Apply identical fixes to:
- `useCreateEmployerProfile()` in `useUserProfile.ts`
- `EmployerDashboard.tsx` guard logic
- `EmployerProfileSetup.tsx` submission handler

### Files to Modify
1. `src/hooks/useUserProfile.ts` - Fix cache invalidation query keys
2. `src/pages/welder/WelderDashboard.tsx` - Improve redirect guard
3. `src/pages/welder/WelderProfileSetup.tsx` - Await cache refresh before navigate
4. `src/pages/employer/EmployerDashboard.tsx` - Same dashboard guard fix
5. `src/pages/employer/EmployerProfileSetup.tsx` - Same submit handler fix

