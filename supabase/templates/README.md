# GlobeGenie Invite Email Templates

For hosted Supabase projects, copy these values into:

`Supabase Dashboard -> Authentication -> Email Templates`

Use the following subjects:

- `Invite user` subject:
  `{{ .Data.inviter_name }} invited you "{{ .Data.trip_title }}" on Globegenie`
- `Magic Link` subject:
  `{{ .Data.inviter_name }} invited you "{{ .Data.trip_title }}" on Globegenie`

Use the following HTML bodies:

- `Invite user` body:
  contents of [invite-trip.html](/Users/Peeyush/Documents/Programming%20Prep/compass-journey-app/supabase/templates/invite-trip.html)
- `Magic Link` body:
  contents of [magic-link-trip.html](/Users/Peeyush/Documents/Programming%20Prep/compass-journey-app/supabase/templates/magic-link-trip.html)

Required redirect URLs in Supabase Auth settings:

- `http://127.0.0.1:8080/invite`
- `http://127.0.0.1:8080/invite/accept`
- `http://127.0.0.1:8080/login`
- `http://127.0.0.1:8080/signup`
- `http://127.0.0.1:8080/trip/*`

Notes:

- Existing GlobeGenie users receive a `Magic Link` email and are routed to `Signin`.
- New invitees receive an `Invite user` email and are routed to `Signup`.
- After auth, both flows end at the shared trip and the trip appears in `Trips Shared with You`.
