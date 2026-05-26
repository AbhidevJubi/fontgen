# FontGen Backend Setup Checklist

Complete this checklist to ensure your backend is fully configured and ready to use.

## 📦 Phase 1: Dependencies (5 min)

- [ ] Run `npm install` to install new packages
- [ ] Verify no errors in terminal
- [ ] Check `node_modules/@supabase/` exists
- [ ] Check `node_modules/@google/` exists
- [ ] Check `node_modules/bcrypt/` exists

## 🗄️ Phase 2: Supabase Setup (15 min)

### Account & Project

- [ ] Created Supabase account at https://supabase.com
- [ ] Created new project named "fontgen"
- [ ] Project is in active state (green checkmark)
- [ ] Waited for database initialization

### API Keys

- [ ] Copied `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copied `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copied `SUPABASE_SERVICE_ROLE_KEY`
- [ ] All keys are pasted in `.env.local`

### Database Tables

- [ ] Ran SQL query to create `movies` table
- [ ] Ran SQL query to create `admin_credentials` table
- [ ] Default admin inserted: `admin@fontgen.com` / `admin123`
- [ ] Enabled RLS on `movies` table
- [ ] Created RLS policies for public read and admin write

### Storage Buckets

- [ ] Created `movie-titles` bucket (Private)
- [ ] Created `sample-backgrounds` bucket (Private)

### Verification

- [ ] SQL Editor shows both tables exist
- [ ] Storage shows both buckets
- [ ] Can run: `SELECT COUNT(*) FROM movies;`
- [ ] Can run: `SELECT COUNT(*) FROM admin_credentials;`

## 🔑 Phase 3: API Keys

### Gemini API

- [ ] Created Google account (if needed)
- [ ] Went to https://makersuite.google.com/app/apikeys
- [ ] Created new API key
- [ ] Copied key to `GEMINI_API_KEY` in `.env.local`

### Environment File

- [ ] Created `.env.local` file in project root
- [ ] Added all 4 variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY`
- [ ] No typos in variable names
- [ ] All values copied exactly without extra spaces

## 🚀 Phase 4: Backend API Routes

### Route Files Created

- [ ] `/app/api/admin/auth/route.ts` exists
- [ ] `/app/api/movies/route.ts` exists
- [ ] `/app/api/upload/route.ts` exists
- [ ] `/app/api/generate-title/route.ts` exists

### Library Files Created

- [ ] `/lib/supabase-server.ts` exists
- [ ] `/lib/api-client.ts` exists
- [ ] `/lib/chroma-key.ts` exists

### Documentation Files

- [ ] `SUPABASE_SETUP.md` exists
- [ ] `DATABASE_SCHEMA.md` exists
- [ ] `BACKEND_INTEGRATION.md` exists
- [ ] `BACKEND_README.md` exists
- [ ] `EXAMPLE_ADMIN_INTEGRATION.tsx` exists
- [ ] `EXAMPLE_FONTLIGHTBOX_INTEGRATION.tsx` exists

## 🧪 Phase 5: Testing API Routes

### Test 1: Start Dev Server

- [ ] Run `npm run dev`
- [ ] Server starts without errors
- [ ] No console errors about environment variables

### Test 2: Test Auth Endpoint

```bash
curl -X POST http://localhost:3000/api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"admin@fontgen.com","password":"admin123"}'
```

- [ ] Response includes `token` and `email`
- [ ] No 500 errors

### Test 3: Test Movies Endpoint

```bash
curl http://localhost:3000/api/movies
```

- [ ] Returns JSON array (empty is ok)
- [ ] No 500 errors

### Test 4: Supabase Connection

In Supabase SQL Editor:

```sql
SELECT * FROM movies;
```

- [ ] Returns empty table (no errors)

## 🎯 Phase 6: Frontend Component Updates

### Admin Page

- [ ] Read `EXAMPLE_ADMIN_INTEGRATION.tsx`
- [ ] Updated imports in `app/admin/page.tsx`
- [ ] Updated `handleCreateOrUpdate` function
- [ ] Updated `handleLogin` function
- [ ] Updated `useEffect` to load from API
- [ ] Updated `handleDelete` function
- [ ] Tested adding new movie

### FontLightbox Component

- [ ] Read `EXAMPLE_FONTLIGHTBOX_INTEGRATION.tsx`
- [ ] Updated imports in `app/components/FontLightbox.tsx`
- [ ] Updated `handleGenerate` function
- [ ] Updated `drawCanvas` function
- [ ] Added error handling
- [ ] Added loading states

## ✅ Phase 7: End-to-End Testing

### Admin Flow

- [ ] Go to `/admin`
- [ ] Login works with email/password
- [ ] Can create new movie
- [ ] Can upload title reference image
- [ ] Can upload sample backgrounds
- [ ] Movie appears in list
- [ ] Data appears in Supabase dashboard
- [ ] Can edit existing movie
- [ ] Can delete movie

### Guest Flow

- [ ] Go to home page
- [ ] Movies display (from Supabase)
- [ ] Click "Try Now" on any movie
- [ ] FontLightbox opens
- [ ] Can enter text
- [ ] Can upload image
- [ ] Click "Generate Title Font"
- [ ] Gemini API generates image (may take 5-10 sec)
- [ ] Chroma key removes green background
- [ ] Step 2 shows text on user's background
- [ ] Can adjust position and size
- [ ] Can download JPG

## 🔍 Phase 8: Verification in Dashboard

### Supabase Dashboard

- [ ] Go to project dashboard
- [ ] Click **SQL Editor**
- [ ] Run: `SELECT COUNT(*) FROM movies;`
- [ ] Result shows number of movies added
- [ ] Storage **movie-titles** has uploaded files
- [ ] Storage **sample-backgrounds** has uploaded files

### Gemini API

- [ ] Go to https://makersuite.google.com/app/usage
- [ ] See API calls being made
- [ ] Quota not exceeded

## ⚠️ Troubleshooting Checklist

If something doesn't work:

### Environment Variables

- [ ] `.env.local` exists in project root
- [ ] All 4 variables present
- [ ] No leading/trailing spaces
- [ ] No quotes around values
- [ ] Restarted dev server after changes

### Supabase Connection

- [ ] URL is correct (copy from dashboard)
- [ ] Keys are current (not old ones)
- [ ] Project is active in Supabase dashboard
- [ ] Not rate limited

### Gemini API

- [ ] API key is valid
- [ ] Account has quota remaining
- [ ] Check usage at makersuite.google.com
- [ ] Try simple text first

### Database

- [ ] Tables exist: `movies` and `admin_credentials`
- [ ] RLS is enabled
- [ ] Policies are created correctly
- [ ] Can run SELECT query in SQL Editor

### Components

- [ ] Imports are correct
- [ ] API functions exist in `/lib/api-client.ts`
- [ ] Try/catch blocks handle errors
- [ ] Console logs for debugging

## 📋 Quick Reference

### Important URLs

- Supabase Dashboard: https://app.supabase.com
- Gemini API Console: https://makersuite.google.com/app/apikeys
- Gemini Usage: https://makersuite.google.com/app/usage

### Important Files

- Environment: `.env.local`
- API Routes: `/app/api/`
- Libraries: `/lib/`
- Admin Page: `/app/admin/page.tsx`
- FontLightbox: `/app/components/FontLightbox.tsx`

### Important Credentials

- Admin Email: `admin@fontgen.com`
- Admin Password: `admin123`

### API Endpoints

- Login: `POST /api/admin/auth`
- Fetch Movies: `GET /api/movies`
- Create Movie: `POST /api/movies`
- Update Movie: `PUT /api/movies`
- Delete Movie: `DELETE /api/movies`
- Upload: `POST /api/upload`
- Generate: `POST /api/generate-title`

## 🎉 You're Done!

When all checkboxes are complete, your FontGen backend is fully functional!

### Next Steps:

1. Test the complete user flow
2. Optimize Gemini prompts if needed
3. Add more movies to the database
4. Monitor Supabase usage
5. Deploy to production

---

## 📞 Common Issues & Solutions

### "Environment variable not found"

- Double-check `.env.local` spelling
- Ensure all variable names match exactly
- Restart dev server after adding variables

### "Supabase connection failed"

- Verify URL format: `https://[project-id].supabase.co`
- Check project status in dashboard
- Try getting new keys from dashboard

### "Gemini API not responding"

- Verify API key is active
- Check quota at makersuite.google.com
- Try generating with shorter text
- Check for CORS issues in console

### "Upload failed"

- Verify storage buckets exist
- Check bucket names are exact: `movie-titles`, `sample-backgrounds`
- Ensure buckets are set to Private
- File size might be too large

### "Green background not removed"

- Verify reference image has pure #00FF00 green
- Check chroma key threshold in code
- Try with different threshold value
- Check browser console for errors

---

Happy coding! 🚀
