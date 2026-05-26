# FontGen Backend Setup - Complete Guide

## 📋 Prerequisites

Before starting, make sure you have:

- Node.js 18+ installed
- npm or yarn
- A Supabase account (free) - https://supabase.com
- A Google API key for Gemini - https://makersuite.google.com/app/apikeys

---

## 🚀 Quick Setup (5 steps)

### Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up (free)
2. Click "New Project"
3. Fill in:
   - Project Name: `fontgen`
   - Database Password: Create a strong password
   - Region: Closest to you
4. Wait 2-3 minutes for project creation

### Step 2: Get API Keys

After project is created:

1. Click on your project to open dashboard
2. Go to **Settings** (⚙️ icon at bottom left)
3. Click **API**
4. Copy these three values:
   - **Project URL** (starts with `https://`)
   - **anon public** (under Project API keys)
   - **service_role** (under Project API keys, keep secret!)

### Step 3: Create Database Tables

1. In Supabase dashboard, click **SQL Editor**
2. Click **New Query**
3. Copy-paste this SQL:

```sql
-- Create movies table
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_name VARCHAR(255) NOT NULL,
  language VARCHAR(100) NOT NULL,
  actor VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  title_image_url TEXT NOT NULL,
  sample_images_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_credentials table
CREATE TABLE admin_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin (password: admin123)
INSERT INTO admin_credentials (email, password_hash)
VALUES ('admin@fontgen.com', '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5EQaYvM7KPDKO');

-- Enable RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "movies_public_read" ON movies FOR SELECT USING (true);
CREATE POLICY "movies_admin_write" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "movies_admin_update" ON movies FOR UPDATE USING (true);
CREATE POLICY "movies_admin_delete" ON movies FOR DELETE USING (true);
```

4. Click **Run** (blue button)
5. If no errors appear, tables are created ✅

### Step 4: Create Storage Buckets

1. In Supabase dashboard, click **Storage**
2. Click **Create a new bucket**
3. Name: `movie-titles`
   - Make it **Private**
   - Click **Create**
4. Repeat for second bucket:
   - Name: `sample-backgrounds`
   - Make it **Private**

### Step 5: Setup Environment Variables

1. In your project root, create `.env.local` (if it doesn't exist)
2. Add these variables (replace with your actual keys):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSyD...
```

3. Save the file

---

## 🔧 Install Dependencies

Run this command:

```bash
npm install
```

This installs:

- `@supabase/supabase-js` - Database client
- `@google/generative-ai` - Gemini AI
- `bcrypt` - Password hashing

---

## ✅ Verify Setup

### Test 1: Check API Routes

```bash
# These should return 404 (not found pages):
curl http://localhost:3000/api/movies
curl http://localhost:3000/api/admin/auth
```

### Test 2: Check Supabase Connection

1. Go to Supabase dashboard
2. Click **SQL Editor**
3. Run:

```sql
SELECT * FROM movies LIMIT 1;
```

Should return empty table (no errors) ✅

### Test 3: Check Gemini API

Visit https://makersuite.google.com/app/apikeys and verify your key is listed.

---

## 📱 How to Use

### For Admin:

1. Go to `http://localhost:3000/admin`
2. Login with:
   - Email: `admin@fontgen.com`
   - Password: `admin123`
3. Fill form with movie details
4. Upload title reference image (PNG with the font style)
5. Upload sample background images
6. Click "Create & Add Font"
7. Data is saved to Supabase

### For Guest Users:

1. Go to home page
2. Click on any movie card or "Try Now"
3. Enter text for the movie title
4. Upload your background image
5. Click "Generate Title Font"
6. AI generates the text with the movie's font style
7. Green background is automatically removed
8. Adjust position and size in Step 2
9. Click "Download JPG"

---

## 📚 Files Created/Updated

### New API Routes (in `app/api/`)

- `admin/auth/route.ts` - Login/logout
- `movies/route.ts` - CRUD operations
- `upload/route.ts` - Image upload
- `generate-title/route.ts` - Gemini image generation

### New Libraries (in `lib/`)

- `supabase-server.ts` - Supabase client
- `api-client.ts` - API helper functions
- `chroma-key.ts` - Green background removal

### Documentation

- `SUPABASE_SETUP.md` - Detailed setup
- `DATABASE_SCHEMA.md` - Database structure
- `BACKEND_INTEGRATION.md` - How to update components

### Configuration

- `.env.example` - Environment variables template
- `package.json` - Updated dependencies

---

## 🐛 Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is required"

→ Check `.env.local` has correct URL and you restarted dev server

### "Invalid API key"

→ Copy the exact key from Supabase (includes spaces sometimes)

### Uploads fail

→ Verify storage buckets are created and set to Private

### Gemini API fails

→ Check quota at https://makersuite.google.com/app/pricing
→ Free tier has daily limits

### Green background not removed

→ Verify reference image has pure #00FF00 green
→ Check browser console for chroma key errors

---

## 📝 Next Steps

1. **Update Admin Page** - Modify `app/admin/page.tsx` to use API endpoints
2. **Update FontLightbox** - Modify `app/components/FontLightbox.tsx` for Gemini
3. **Test Everything** - Run through both admin and guest flows
4. **Monitor** - Check Supabase dashboard for stored data
5. **Optimize** - Adjust Gemini prompts based on results

See `BACKEND_INTEGRATION.md` for detailed integration instructions.

---

## 🔐 Security Notes

- ⚠️ Never commit `.env.local` to git
- ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- ✅ Use RLS policies to restrict data access
- ✅ Validate all inputs on backend
- ✅ Rate limit API endpoints in production

---

## 📞 Support

If you encounter issues:

1. Check the error message in console
2. Review `SUPABASE_SETUP.md`
3. Verify all environment variables
4. Check Supabase dashboard for data
5. Test API endpoints directly with curl/Postman

---

## 🎉 You're All Set!

Your backend infrastructure is now ready. The frontend components are ready to be integrated with these APIs.

Happy coding! 🚀
