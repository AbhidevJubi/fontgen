# FontGen Backend Integration Guide

## Overview

This guide explains how to integrate the backend APIs with your frontend components.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Admin Login → Upload Images → Save to Supabase            │
│      ↓              ↓                ↓                       │
│   /api/auth   /api/upload      /api/movies                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GUEST USER FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  View Movies → Click Try Now → Enter Text + Upload Image   │
│      ↓              ↓              ↓                         │
│  /api/movies  FontLightbox   handleGenerate                │
│                                 ↓                           │
│                          /api/generate-title               │
│                          (Gemini Flash)                    │
│                                 ↓                           │
│                          Chroma Key (JS)                   │
│                                 ↓                           │
│                         Step 2: Adjust                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
fontgen/
├── app/
│   ├── admin/page.tsx              (Update for Supabase)
│   ├── components/
│   │   ├── FontLightbox.tsx         (Update for Gemini + Chroma)
│   │   └── ...
│   ├── api/
│   │   ├── admin/
│   │   │   └── auth/route.ts        ✨ NEW
│   │   ├── movies/route.ts          ✨ NEW
│   │   ├── upload/route.ts          ✨ NEW
│   │   └── generate-title/route.ts  ✨ NEW
│   ├── page.tsx
│   └── page.css
├── lib/
│   ├── supabase-server.ts           ✨ NEW
│   ├── chroma-key.ts                ✨ NEW
│   ├── api-client.ts                ✨ NEW
│   └── ...
├── SUPABASE_SETUP.md                ✨ NEW
├── DATABASE_SCHEMA.md               ✨ NEW
├── .env.local                       (Update with API keys)
├── package.json                     ✨ UPDATED
└── ...
```

## Step-by-Step Integration

### 1. Install Dependencies

```bash
npm install
# This installs the new packages in package.json:
# - @supabase/supabase-js
# - @google/generative-ai
# - bcrypt
```

### 2. Setup Supabase

Follow `SUPABASE_SETUP.md`:

1. Create account at https://supabase.com
2. Create project
3. Get API keys
4. Create tables using provided SQL
5. Create storage buckets
6. Setup RLS policies

### 3. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Update Admin Page

The admin page (`app/admin/page.tsx`) currently uses local storage. Update it to use Supabase:

#### Changes needed:

Replace local storage calls with:

```typescript
import {
  fetchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  uploadImage,
  adminLogin,
  adminLogout,
} from "@/lib/api-client";

// On form submit:
const handleCreateOrUpdate = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    // Upload images first
    const titleImageUpload = await uploadImage(
      titleImageFile,
      "movie-titles",
      `${movieName}-${Date.now()}`,
    );

    const sampleImageUrls = [];
    for (const file of sampleImageFiles) {
      const upload = await uploadImage(file, "sample-backgrounds");
      sampleImageUrls.push(upload.url);
    }

    // Create/Update movie in database
    const movieData = {
      id: editId || undefined,
      movieName,
      language: customLanguage || language,
      actor: customActor || actor,
      year: customYear ? parseInt(customYear) : year,
      featured,
      titleImageUrl: titleImageUpload.url,
      sampleImagesUrls: sampleImageUrls,
    };

    if (editId) {
      await updateMovie(movieData);
    } else {
      await createMovie(movieData);
    }

    // Refresh movies list
    const updatedMovies = await fetchMovies();
    setFonts(updatedMovies);
    resetForm();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
};

// On login:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const result = await adminLogin(email, password);
    sessionStorage.setItem("fontgen_admin_token", result.token);
    setIsLoggedIn(true);
  } catch (error) {
    setLoginError(error.message);
  }
};

// On logout:
const handleLogout = async () => {
  await adminLogout();
  sessionStorage.removeItem("fontgen_admin_token");
  setIsLoggedIn(false);
};
```

### 5. Update FontLightbox Component

The FontLightbox component currently simulates AI generation. Update it to use Gemini:

#### Changes needed in `FontLightbox.tsx`:

```typescript
import {
  generateTitle,
  fileToBase64,
  imageUrlToBase64,
} from "@/lib/api-client";
import { chromaKeyImage } from "@/lib/chroma-key";

// In handleGenerate function:
const handleGenerate = async () => {
  if (!userText.trim()) return;
  if (!userImage) return;

  try {
    setIsGenerating(true);

    // Convert images to base64
    const userImageBase64 = userImage; // Already base64 from upload
    const referenceImageBase64 = await imageUrlToBase64(font.titleImageUrl);

    // Call Gemini API
    const result = await generateTitle(
      userText,
      userImageBase64,
      referenceImageBase64,
      font.movieName,
    );

    // Apply chroma key to remove green background
    const chromaKeyedImage = await chromaKeyImage(result.generatedImage);

    // Store for canvas rendering
    setAiGeneratedImage(chromaKeyedImage);

    setIsGenerating(false);
    setStep(2);
  } catch (error) {
    alert(`Generation failed: ${error.message}`);
    setIsGenerating(false);
  }
};
```

### 6. Update Canvas Drawing Logic

In `FontLightbox.tsx`, modify the canvas drawing to support AI-generated image:

```typescript
// Update drawCanvas to use AI-generated image if available
const drawCanvas = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas || step !== 2 || isGenerating) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Use background image (user uploaded)
  const bgImg = new window.Image();
  bgImg.crossOrigin = "anonymous";
  bgImg.onload = () => {
    canvas.width = bgImg.width;
    canvas.height = bgImg.height;
    ctx.drawImage(bgImg, 0, 0);

    // Draw AI-generated text image if available
    if (aiGeneratedImage) {
      const textImg = new window.Image();
      textImg.crossOrigin = "anonymous";
      textImg.onload = () => {
        const x = (posX / 100) * canvas.width;
        const y = (posY / 100) * canvas.height;
        const fontSize = Math.round((titleSize / 100) * (canvas.width * 0.12));

        // Draw with scaling
        const imgWidth = (fontSize / 100) * canvas.width;
        const imgHeight = (textImg.height / textImg.width) * imgWidth;

        ctx.drawImage(
          textImg,
          x - imgWidth / 2,
          y - imgHeight / 2,
          imgWidth,
          imgHeight,
        );
      };
      textImg.src = aiGeneratedImage;
    }
  };
  bgImg.src = userImage;
}, [step, userImage, aiGeneratedImage, titleSize, posX, posY, isGenerating]);
```

## API Reference

### Authentication

```typescript
// Login
const { token, email } = await adminLogin("admin@fontgen.com", "admin123");
sessionStorage.setItem("fontgen_admin_token", token);

// Logout
await adminLogout();
```

### Movies

```typescript
// Fetch all movies
const movies = await fetchMovies();

// Fetch with filters
const movies = await fetchMovies({
  language: "Hindi",
  actor: "Prabhas",
  year: 2025,
  featured: true,
});

// Create movie
const newMovie = await createMovie({
  movieName: "Kalki 2898 AD",
  language: "Telugu",
  actor: "Prabhas",
  year: 2024,
  featured: true,
  titleImageUrl: "https://...",
  sampleImagesUrls: ["https://...", "https://..."],
});

// Update movie
const updated = await updateMovie({
  id: "movie-id",
  movieName: "Updated Title",
  // ... other fields
});

// Delete movie
await deleteMovie("movie-id");
```

### File Upload

```typescript
// Upload title reference image
const { url, path } = await uploadImage(
  titleImageFile,
  "movie-titles",
  "movie-name-title",
);

// Upload sample background
const { url, path } = await uploadImage(backgroundFile, "sample-backgrounds");
```

### Image Generation

```typescript
// Generate title using Gemini
const result = await generateTitle(
  "DILWALE", // userText
  userImageBase64, // user's background image
  referenceImageBase64, // admin's reference title PNG
  "Dilwale", // movieName
);

// result.generatedImage contains PNG with green background
// Next step: Apply chroma keying
const chromaKeyed = await chromaKeyImage(result.generatedImage);
```

### Chroma Key

```typescript
// Remove green background from image
const transparentImage = await chromaKeyImage(imageWithGreenBackground);

// Or use advanced version with custom tolerance
const transparentImage = await chromaKeyImageAdvanced(
  imageWithGreenBackground,
  { r: 0, g: 255, b: 0 }, // target color (pure green)
  50, // tolerance (0-255)
);
```

## Error Handling

All API functions throw errors. Wrap in try-catch:

```typescript
try {
  const movie = await createMovie(movieData);
} catch (error) {
  console.error(error);
  alert(error.message);
}
```

## Session Management

Admin sessions are stored in `sessionStorage`:

```typescript
// Store token after login
sessionStorage.setItem("fontgen_admin_token", token);

// Check if admin is logged in
const token = sessionStorage.getItem("fontgen_admin_token");
const isLoggedIn = !!token;

// Clear on logout
sessionStorage.removeItem("fontgen_admin_token");
```

## Testing the Flow

### Test Admin Panel:

1. Navigate to `/admin`
2. Login with `admin@fontgen.com` / `admin123`
3. Fill form and upload images
4. Click "Create & Add Font"
5. Check Supabase dashboard to verify data

### Test Guest Flow:

1. Go to home page
2. Click featured movie or "Explore All Fonts"
3. Click "Try Now" on any movie
4. Enter text and upload image
5. Click "Generate Title Font"
6. Verify image is generated and green background is removed
7. Adjust position/size in Step 2
8. Download JPG

## Troubleshooting

### API errors

- Check `.env.local` has correct credentials
- Verify Supabase project is active
- Check API routes exist in `/app/api/`

### Upload failures

- Verify storage buckets are created
- Check RLS policies are correct
- Ensure file size is reasonable

### Gemini generation failures

- Check `GEMINI_API_KEY` is valid
- Verify API quota hasn't been exceeded
- Try with simpler text input first

### Chroma key issues

- Ensure reference image has pure #00FF00 green background
- Check browser console for CORS errors
- Verify image URLs are accessible

## Next Steps

1. Update admin page to use APIs
2. Update FontLightbox component
3. Test the complete flow
4. Monitor Supabase dashboard
5. Optimize image generation prompts based on results
