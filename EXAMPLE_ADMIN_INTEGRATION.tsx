/**
 * EXAMPLE: Updated Admin Page with Supabase Integration
 *
 * This file shows how to modify app/admin/page.tsx to use the backend APIs
 * Replace local storage calls with these API calls
 */

// ═══════════════════════════════════════════
// IMPORTS TO ADD
// ═══════════════════════════════════════════

import {
  fetchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  uploadImage,
  adminLogin,
  adminLogout,
  MovieData,
} from "@/lib/api-client";

// ═══════════════════════════════════════════
// CHANGES TO STATE
// ═══════════════════════════════════════════

// Add these new states:
const [titleImageFile, setTitleImageFile] = useState<File | null>(null);
const [sampleImageFiles, setSampleImageFiles] = useState<File[]>([]);
const [uploadProgress, setUploadProgress] = useState(0);
const [isSaving, setIsSaving] = useState(false);

// ═══════════════════════════════════════════
// UPDATE FORM SUBMISSION HANDLER
// ═══════════════════════════════════════════

const handleCreateOrUpdate = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!movieName.trim()) {
    alert("Please enter the movie name");
    return;
  }

  const chosenLanguage = customLanguage.trim() || language;
  const chosenActor = customActor.trim() || actor;
  const chosenYear = customYear ? Number(customYear) : year;

  if (!chosenLanguage.trim()) {
    alert("Please enter a language.");
    return;
  }
  if (!chosenActor.trim()) {
    alert("Please enter an actor.");
    return;
  }
  if (!chosenYear || Number.isNaN(chosenYear)) {
    alert("Please enter a valid year.");
    return;
  }

  setIsSaving(true);
  setUploadProgress(0);

  try {
    // Upload title image (required)
    let titleImageUrl = titleImage;
    if (titleImageFile) {
      setUploadProgress(20);
      const titleUpload = await uploadImage(
        titleImageFile,
        "movie-titles",
        `${movieName}-${Date.now()}-title`,
      );
      titleImageUrl = titleUpload.url;
    }

    if (!titleImageUrl) {
      alert("Please upload a title reference image");
      setIsSaving(false);
      return;
    }

    // Upload sample images
    setUploadProgress(40);
    const sampleImageUrls = [];
    for (const file of sampleImageFiles) {
      const sampleUpload = await uploadImage(
        file,
        "sample-backgrounds",
        `${movieName}-${Date.now()}-${Math.random()}`,
      );
      sampleImageUrls.push(sampleUpload.url);
    }

    // Prepare movie data
    const movieData: MovieData = {
      ...(editId && { id: editId }),
      movieName: movieName.trim(),
      language: chosenLanguage,
      actor: chosenActor,
      year: chosenYear,
      featured,
      titleImageUrl,
      sampleImagesUrls: sampleImageUrls,
    };

    // Create or update movie
    setUploadProgress(80);
    if (editId) {
      await updateMovie(movieData);
      alert("Movie font updated successfully!");
    } else {
      await createMovie(movieData);
      alert("New movie font created successfully!");
    }

    // Refresh movies list
    setUploadProgress(90);
    const updatedMovies = await fetchMovies();
    setFonts(updatedMovies);

    setUploadProgress(100);
    resetForm();
  } catch (error) {
    console.error("Error:", error);
    alert(
      `Error: ${error instanceof Error ? error.message : "Failed to save"}`,
    );
  } finally {
    setIsSaving(false);
    setUploadProgress(0);
  }
};

// ═══════════════════════════════════════════
// UPDATE LOGIN HANDLER
// ═══════════════════════════════════════════

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const result = await adminLogin(email, password);
    // Store token in session storage
    sessionStorage.setItem("fontgen_admin_token", result.token);
    setIsLoggedIn(true);
    setLoginError("");
  } catch (error) {
    setLoginError(
      error instanceof Error ? error.message : "Invalid email or password",
    );
  }
};

// ═══════════════════════════════════════════
// UPDATE LOGOUT HANDLER
// ═══════════════════════════════════════════

const handleLogout = async () => {
  try {
    await adminLogout();
    sessionStorage.removeItem("fontgen_admin_token");
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// ═══════════════════════════════════════════
// UPDATE LOAD EFFECT
// ═══════════════════════════════════════════

useEffect(() => {
  const loadData = async () => {
    try {
      // Check if admin is logged in
      const token = sessionStorage.getItem("fontgen_admin_token");
      if (token) {
        setIsLoggedIn(true);
      }

      // Load movies from Supabase
      const loadedMovies = await fetchMovies();
      setFonts(loadedMovies);
    } catch (error) {
      console.error("Load error:", error);
      // Fall back to empty state
      setFonts([]);
    }
  };

  loadData();
}, []);

// ═══════════════════════════════════════════
// UPDATE DELETE HANDLER
// ═══════════════════════════════════════════

const handleDelete = async (id: string) => {
  if (!confirm("Are you sure you want to delete this font card?")) {
    return;
  }

  try {
    await deleteMovie(id);
    const updated = fonts.filter((f) => f.id !== id);
    setFonts(updated);
    if (editId === id) {
      resetForm();
    }
  } catch (error) {
    alert(
      `Error deleting: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

// ═══════════════════════════════════════════
// UPDATE FILE HANDLERS
// ═══════════════════════════════════════════

const handleTitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setTitleImageFile(file);
    // Also read as preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTitleImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files) {
    const newFiles = Array.from(files);
    setSampleImageFiles((prev) => [...prev, ...newFiles]);

    // Also create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSampleImages((prev) => {
          const base64 = ev.target?.result as string;
          if (prev.includes(base64)) return prev;
          return [...prev, base64];
        });
      };
      reader.readAsDataURL(file);
    });
  }
};

// ═══════════════════════════════════════════
// UPDATE START EDIT HANDLER
// ═══════════════════════════════════════════

const startEdit = (font: MovieData) => {
  setEditId(font.id || null);
  setMovieName(font.movieName);
  setLanguage(font.language);
  setActor(font.actor);
  setYear(font.year);
  setCustomLanguage("");
  setCustomActor("");
  setCustomYear("");
  setFeatured(font.featured);
  setTitleImage(font.titleImageUrl);
  setTitleImageFile(null);
  setSampleImages(font.sampleImagesUrls);
  setSampleImageFiles([]);

  window.scrollTo({ top: 120, behavior: "smooth" });
};

// ═══════════════════════════════════════════
// UPDATE FORM COMPONENT (in JSX)
// ═══════════════════════════════════════════

// Show upload progress while saving
{
  isSaving && (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        backgroundColor: "#00a8e8",
        width: `${uploadProgress}%`,
        transition: "width 0.3s ease",
        zIndex: 1000,
      }}
    />
  );
}

// Disable submit button while saving
<button type="submit" className="submit-btn" disabled={isSaving}>
  {isSaving
    ? `Saving... ${uploadProgress}%`
    : editId
      ? "Save Font Changes"
      : "Create & Add Font"}
</button>;
