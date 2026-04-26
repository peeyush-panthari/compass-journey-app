-- Diagnostic: Show all trip_collaborators rows for anonconnect887@gmail.com
SELECT 
  tc.id,
  tc.trip_id,
  tc.user_id,
  tc.email,
  tc.role,
  tc.accepted,
  tc.invited_by,
  tc.created_at,
  t.title AS trip_title,
  p.email AS linked_profile_email
FROM trip_collaborators tc
LEFT JOIN trips t ON t.id = tc.trip_id
LEFT JOIN profiles p ON p.id = tc.user_id
WHERE tc.email = 'anonconnect887@gmail.com'
ORDER BY tc.created_at DESC;

-- Fix: Link the collaborator record to the correct user_id and mark as accepted
UPDATE public.trip_collaborators
SET 
  user_id = (SELECT id FROM public.profiles WHERE email = 'anonconnect887@gmail.com' LIMIT 1),
  accepted = true
WHERE 
  email = 'anonconnect887@gmail.com'
  AND (user_id IS NULL OR accepted = false);

-- Verify the fix
SELECT 
  tc.id,
  tc.trip_id,
  tc.user_id,
  tc.email,
  tc.accepted,
  t.title AS trip_title
FROM trip_collaborators tc
LEFT JOIN trips t ON t.id = tc.trip_id
WHERE tc.email = 'anonconnect887@gmail.com';
