# MediConnect - Fullstack Scaffold (Minimal, Production-ready structure)
This scaffold implements core features for MediConnect, focusing on:
- Patients creating emergency cases with geolocation
- Ambulance operators viewing nearby emergency patients with live locations
- Supabase-backed database (SQL migration provided)
- Frontend (Vite + React) minimal UI for Auth, Hospital Finder, Emergency reporting, Ambulance dashboard
- Serverless function placeholders for payments, NHIS verification, ambulance assignment

**How to use**
1. Create a Supabase project. Copy the SQL in `sql/migrations.sql` into Supabase SQL editor and run it.
2. Set environment variables listed in `.env.example`.
3. Frontend:
   - `cd web`
   - `npm install`
   - `npm run dev`
4. Functions (optional): deploy to Supabase Edge Functions or Vercel.

**Notes**
- This scaffold uses supabase-js for client interactions. Do NOT expose service_role key in client.
- Emergency geolocation: patients share lat/lon when creating emergency; ambulances fetch emergencies and see distance.
- For production: enable RLS, secure service keys, configure webhooks for payments, and use PostGIS for accurate geospatial queries.
