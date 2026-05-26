# Movie Creation Issue - Root Cause Analysis

## ❌ The Problem

When you create a new movie card in the admin panel, it's **NOT saved to Supabase** - it's only saved to browser localStorage. Here's why:

### Current Broken Workflow

```
User clicks "Create New Movie"
        ↓
Admin page saves to localStorage ONLY (line 179)
saveLocalFonts(updatedFonts);
        ↓
Data persists in browser, but NEVER sent to Supabase
        ↓
Reload page → Data lost (if localStorage is cleared)
        ↓
Guest users see NOTHING (guest doesn't have localStorage data)
        ↓
❌ FAIL: No Supabase database entry, no storage files
```

### The Root Causes

**Issue 1: No API Integration**

- `app/admin/page.tsx` (line 179): Calls `saveLocalFonts()` instead of calling API
- It only saves to browser localStorage
- Never calls `/api/movies` POST endpoint

**Issue 2: No Image Upload**

- `app/admin/page.tsx` (lines 96-107): Converts images to base64 strings
- These base64 strings are stored in browser only
- Never uploads to Supabase Storage via `/api/upload`
- The API expects image URLs (from Supabase Storage), not base64 strings

**Issue 3: Base64 vs URLs Mismatch**

- Admin page stores: base64 strings
  ```javascript
  image: "data:image/jpeg;base64,/9j/4AAQ..."
  titleImage: "data:image/png;base64,iVBORw0K..."
  sampleImages: ["data:image/jpeg;base64,...", ...]
  ```
- API route expects: URLs from Supabase Storage
  ```typescript
  titleImageUrl: "https://supabase.../storage/object/public/movie-titles/xyz.png"
  sampleImagesUrls: ["https://supabase.../storage/object/public/sample-backgrounds/abc.jpg", ...]
  ```

### Code Evidence

**In `app/admin/page.tsx` (handleCreateOrUpdate function):**

```typescript
// Line 179: Only saves to localStorage
setFonts(updatedFonts);
saveLocalFonts(updatedFonts); // ❌ This is ALL it does
resetForm();

// ❌ MISSING: No call to /api/movies
// ❌ MISSING: No image uploads to Supabase Storage
// ❌ MISSING: No API error handling
```

**In `app/data/fonts.ts` (saveLocalFonts function):**

```typescript
export function saveLocalFonts(fonts: MovieFont[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("fontgen_fonts", JSON.stringify(fonts)); // ❌ Only localStorage
  }
}
```

**In `app/api/upload/route.ts` (what needs to be called):**

```typescript
// Expected to be called with FormData:
// file: File
// bucketName: "movie-titles" or "sample-backgrounds"
// Returns: { success: true, url: "https://...", path: "...", bucketName: "..." }
```

**In `app/api/movies/route.ts` (what needs to be called):**

```typescript
// POST endpoint expects:
{
  movieName: "Pathaan",
  language: "Hindi",
  actor: "Shah Rukh Khan",
  year: 2023,
  featured: true,
  titleImageUrl: "https://supabase.../storage/object/public/movie-titles/pathaan.png",  // ✅ URL
  sampleImagesUrls: ["https://...", "https://...", ...]  // ✅ URLs
}
// NOT base64 strings!
```

### Data Flow Comparison

**Current (BROKEN):**

```
Form Input
    ↓
Convert to base64 (client)
    ↓
Save to localStorage (client)
    ↓
❌ STOP - Supabase never involved
    ↓
Data lost on refresh, not accessible to guests
```

**Correct (TO BE FIXED):**

```
Form Input
    ↓
Upload title image to Supabase Storage via /api/upload
    ↓ (get URL: https://...movie-titles/xyz.png)
    ↓
Upload sample images to Supabase Storage via /api/upload (multiple calls)
    ↓ (get URLs: https://...sample-backgrounds/abc.jpg, etc)
    ↓
Call /api/movies POST with URLs
    ↓ (saved to Supabase database)
    ↓
Update local state
    ↓
✅ Data persisted in Supabase for all users
```

## 🔧 Files That Need Changes

### 1. `app/admin/page.tsx` - MAIN FIX

- Replace `handleCreateOrUpdate()` function
- Add image upload logic before creating movie
- Add API integration
- Add error handling
- Add loading states

### 2. `app/data/fonts.ts` - NO CHANGE NEEDED

- Functions work correctly for localStorage
- Used for demo/mock data fallback

### 3. `app/api/upload/route.ts` - ALREADY CORRECT

- ✅ Ready to use

### 4. `app/api/movies/route.ts` - ALREADY CORRECT

- ✅ Ready to use

## 🚀 The Fix

The admin page needs to implement this workflow:

```typescript
const handleCreateOrUpdate = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsLoading(true);
  try {
    // 1. Upload title image if changed
    let titleImageUrl = titleImage;
    if (titleImage.startsWith("data:")) {
      const titleFile = await dataURLToFile(titleImage, "title.png");
      const uploadResult = await uploadImage(titleFile, "movie-titles");
      titleImageUrl = uploadResult.url;
    }

    // 2. Upload sample images if any are base64
    let sampleImageUrls = sampleImages;
    const newSampleUrls = [];
    for (const sampleImg of sampleImages) {
      if (sampleImg.startsWith("data:")) {
        const sampleFile = await dataURLToFile(
          sampleImg,
          `sample-${Date.now()}.jpg`,
        );
        const uploadResult = await uploadImage(
          sampleFile,
          "sample-backgrounds",
        );
        newSampleUrls.push(uploadResult.url);
      } else {
        newSampleUrls.push(sampleImg);
      }
    }

    // 3. Create/update movie in Supabase via API
    if (editId) {
      await updateMovie({
        id: editId,
        movieName: movieName.trim(),
        language: chosenLanguage,
        actor: chosenActor,
        year: chosenYear,
        featured,
        titleImageUrl,
        sampleImagesUrls: newSampleUrls,
      });
    } else {
      await createMovie({
        movieName: movieName.trim(),
        language: chosenLanguage,
        actor: chosenActor,
        year: chosenYear,
        featured,
        titleImageUrl,
        sampleImagesUrls: newSampleUrls,
      });
    }

    // 4. Refresh movies list from Supabase
    const movies = await fetchMovies();
    setFonts(movies);

    alert("Movie saved to Supabase successfully!");
    resetForm();
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};
```

## ✅ Verification

After the fix, verify:

1. ✅ Create a new movie
2. ✅ Check Supabase Database → movies table
   - Should have: movieName, language, actor, year, featured, title_image_url, sample_images_urls
3. ✅ Check Supabase Storage → movie-titles bucket
   - Should have: uploaded title image
4. ✅ Check Supabase Storage → sample-backgrounds bucket
   - Should have: uploaded sample images
5. ✅ Reload page → Movie still appears (loaded from Supabase)
6. ✅ Open guest page → Can see the movie (from Supabase)

## Impact

**Currently (BROKEN):**

- Admin creates movie → Only in browser localStorage
- Guest visits app → Doesn't see the movie (no localStorage data)
- Admin refreshes browser → Movie disappears (localStorage cleared)
- ❌ Movie never saved to Supabase

**After Fix (WORKING):**

- Admin creates movie → Uploaded to Supabase Storage + Database
- Guest visits app → Can see the movie (loaded from Supabase)
- Admin refreshes browser → Movie still there (loaded from Supabase)
- ✅ Movie permanently saved for all users
