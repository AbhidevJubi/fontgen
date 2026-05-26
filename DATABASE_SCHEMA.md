# FontGen Database Schema

## Tables Overview

### 1. `movies` Table

Stores all movie font information with references to uploaded images.

```sql
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_name VARCHAR(255) NOT NULL,
  language VARCHAR(100) NOT NULL,
  actor VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  title_image_url TEXT NOT NULL,        -- URL to title reference PNG
  sample_images_urls TEXT[] DEFAULT ARRAY[]::TEXT[],  -- URLs to sample backgrounds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**

- `id`: Unique identifier (auto-generated UUID)
- `movie_name`: Name of the movie (e.g., "Kalki 2898 AD")
- `language`: Movie language (e.g., "Hindi", "Telugu")
- `actor`: Lead actor/hero name
- `year`: Release year
- `featured`: Whether to show in featured section
- `title_image_url`: Public URL to the reference title PNG (stored in `movie-titles` bucket)
- `sample_images_urls`: Array of URLs to sample background images (stored in `sample-backgrounds` bucket)
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

### 2. `admin_credentials` Table

Stores admin authentication information.

```sql
CREATE TABLE admin_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**

- `id`: Unique identifier
- `email`: Admin email (must be unique)
- `password_hash`: Bcrypt hashed password
- `created_at`: Account creation timestamp

**Default Admin:**

- Email: `admin@fontgen.com`
- Password: `admin123`

## Storage Buckets

### 1. `movie-titles` Bucket

**Purpose:** Store reference title PNG images uploaded by admins

**Policies:**

- Private (authenticated users only)
- Admin can upload/delete
- Guest users can read (for public display)

**File Structure:**

```
movie-titles/
├── [timestamp]-[uuid].png
├── [timestamp]-[uuid].png
└── ...
```

### 2. `sample-backgrounds` Bucket

**Purpose:** Store sample background images for each movie

**Policies:**

- Private (authenticated users only)
- Admin can upload/delete
- Guest users can read

**File Structure:**

```
sample-backgrounds/
├── movie-1/
│   ├── sample-1.jpg
│   ├── sample-2.jpg
│   └── ...
└── movie-2/
    └── ...
```

## Row Level Security (RLS) Policies

### `movies` Table Policies

1. **Public Read** - Everyone can read movies

   ```sql
   CREATE POLICY "movies_public_read" ON movies FOR SELECT USING (true);
   ```

2. **Admin Write** - Admins can insert, update, delete
   ```sql
   CREATE POLICY "movies_admin_write" ON movies FOR INSERT WITH CHECK (true);
   CREATE POLICY "movies_admin_update" ON movies FOR UPDATE USING (true);
   CREATE POLICY "movies_admin_delete" ON movies FOR DELETE USING (true);
   ```

### `admin_credentials` Table Policies

1. **Auth Service Only** - Restrict access to authenticated service role
   ```sql
   ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "admin_service_access" ON admin_credentials
     FOR ALL USING (false) WITH CHECK (false);
   ```

## API Endpoints

### Authentication

- `POST /api/admin/auth` - Login/Logout

### Movies

- `GET /api/movies` - Fetch all movies (with optional filters)
- `POST /api/movies` - Create new movie (admin)
- `PUT /api/movies` - Update movie (admin)
- `DELETE /api/movies` - Delete movie (admin)

### Upload

- `POST /api/upload` - Upload images to storage

### Generation

- `POST /api/generate-title` - Generate title with Gemini
- `PUT /api/generate-title` - Analyze reference image style

## Data Relationships

```
movies (1) ──── (N) user_generated_sessions (hypothetical future)
  └─ title_image_url → movie-titles bucket
  └─ sample_images_urls → sample-backgrounds bucket
```

Currently, user-generated sessions are NOT stored in the database. They are:

- Generated in real-time via Gemini API
- Stored in browser local storage (optional)
- Not persisted in backend

## Migration Notes

To add more admins:

```sql
INSERT INTO admin_credentials (email, password_hash)
VALUES (
  'newadmin@fontgen.com',
  crypt('password123', gen_salt('bf'))  -- bcrypt hash
);
```

To add new languages/actors to the system, add them to the movies entries.
