# FontGen - Supabase Setup Guide

## Step 1: Create Supabase Account & Project

1. **Go to Supabase**: https://supabase.com
2. **Sign up** with your email or GitHub account
3. **Create a new project**:
   - Project Name: `fontgen`
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to your users
4. **Wait** for project to be created (2-3 minutes)

## Step 2: Get Your API Keys

After project creation, go to **Project Settings → API**:

- Copy **Project URL** (starts with `https://`)
- Copy **anon public** key
- Copy **service_role** secret key (keep this private!)

Add to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 3: Create Database Tables

Go to **SQL Editor** in Supabase dashboard and run these queries:

### 3.1 Create `movies` table

```sql
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
```

### 3.2 Create `admin_credentials` table

```sql
CREATE TABLE admin_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin (hash of "admin123")
INSERT INTO admin_credentials (email, password_hash)
VALUES ('admin@fontgen.com', '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5EQaYvM7KPDKO');
```

### 3.3 Create storage buckets

Go to **Storage** section and create these buckets:

**Bucket 1: `movie-titles`**

- Set to Private
- This stores reference title images from admins

**Bucket 2: `sample-backgrounds`**

- Set to Private
- This stores sample background images

### 3.4 Setup RLS (Row Level Security)

In **SQL Editor**, run:

```sql
-- Enable RLS on movies table
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "movies_public_read" ON movies FOR SELECT USING (true);

-- Admin can update/insert (we'll verify via JWT)
CREATE POLICY "movies_admin_write" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "movies_admin_update" ON movies FOR UPDATE USING (true);
CREATE POLICY "movies_admin_delete" ON movies FOR DELETE USING (true);
```

## Step 4: Install Dependencies

```bash
npm install @supabase/supabase-js bcrypt
```

## Step 5: Verify Setup

Once completed, you should have:

- ✅ Supabase project created
- ✅ API keys in `.env.local`
- ✅ `movies` table created
- ✅ `admin_credentials` table with default admin
- ✅ Storage buckets created
- ✅ RLS policies enabled

## Gemini API Setup

1. Go to: https://makersuite.google.com/app/apikeys
2. Click "Create API Key"
3. Copy the key to `GEMINI_API_KEY` in `.env.local`
4. Ensure "Google AI API" is enabled

## Next Steps

- API routes are in `/app/api/`
- Frontend will use these APIs automatically
- Admin login persists via session storage
- Guest users need no authentication
