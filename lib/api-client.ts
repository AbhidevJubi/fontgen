/**
 * API Client Library for FontGen Backend
 * Centralized API calls for admin and guest operations
 */

// ═══════════════════════════════════════════
// ADMIN AUTHENTICATION
// ═══════════════════════════════════════════

export async function adminLogin(
  email: string,
  password: string,
): Promise<{ token: string; email: string }> {
  const response = await fetch("/api/admin/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  return data;
}

export async function adminLogout(): Promise<void> {
  const response = await fetch("/api/admin/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "logout" }),
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}

// ═══════════════════════════════════════════
// MOVIE MANAGEMENT (Admin)
// ═══════════════════════════════════════════

export interface MovieData {
  id?: string;
  movieName: string;
  language: string;
  actor: string;
  year: number;
  featured: boolean;
  titleImageUrl: string;
  sampleImagesUrls: string[];
}

type MovieDbRow = Partial<{
  id: string;
  movie_name: string;
  movieName: string;
  language: string;
  actor: string;
  year: number;
  featured: boolean;
  title_image_url: string;
  titleImageUrl: string;
  sample_images_urls: string[];
  sampleImagesUrls: string[];
}>;

function normalizeMovieRow(row: MovieDbRow): MovieData {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    movieName:
      typeof row.movie_name === "string"
        ? row.movie_name
        : typeof row.movieName === "string"
          ? row.movieName
          : "",
    language: typeof row.language === "string" ? row.language : "",
    actor: typeof row.actor === "string" ? row.actor : "",
    year: typeof row.year === "number" ? row.year : Number(row.year) || 0,
    featured: Boolean(row.featured),
    titleImageUrl:
      typeof row.title_image_url === "string"
        ? row.title_image_url
        : typeof row.titleImageUrl === "string"
          ? row.titleImageUrl
          : "",
    sampleImagesUrls: Array.isArray(row.sample_images_urls)
      ? row.sample_images_urls
      : Array.isArray(row.sampleImagesUrls)
        ? row.sampleImagesUrls
        : [],
  };
}

export async function fetchMovies(filters?: {
  language?: string;
  actor?: string;
  year?: number;
  featured?: boolean;
}): Promise<MovieData[]> {
  const params = new URLSearchParams();
  if (filters?.language) params.append("language", filters.language);
  if (filters?.actor) params.append("actor", filters.actor);
  if (filters?.year) params.append("year", filters.year.toString());
  if (filters?.featured) params.append("featured", "true");

  const response = await fetch(`/api/movies?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch movies");
  }

  const data = await response.json();
  const rawList = data.data || [];
  return rawList.map(normalizeMovieRow);
}

export async function createMovie(movie: MovieData): Promise<MovieData> {
  const response = await fetch("/api/movies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movie),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create movie");
  }

  const data = await response.json();
  return data.data;
}

export async function updateMovie(movie: MovieData): Promise<MovieData> {
  const response = await fetch("/api/movies", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movie),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update movie");
  }

  const data = await response.json();
  return data.data;
}

export async function deleteMovie(movieId: string): Promise<void> {
  const response = await fetch("/api/movies", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: movieId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete movie");
  }
}

// ═══════════════════════════════════════════
// FILE UPLOAD
// ═══════════════════════════════════════════

export async function uploadImage(
  file: File,
  bucketName: "movie-titles" | "sample-backgrounds",
  customFileName?: string,
): Promise<{ url: string; path: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucketName", bucketName);
  if (customFileName) {
    formData.append("fileName", customFileName);
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }

  const data = await response.json();
  return { url: data.url, path: data.path };
}

// ═══════════════════════════════════════════
// IMAGE GENERATION (Guest User)
// ═══════════════════════════════════════════

export interface GenerateTitleResult {
  success: boolean;
  generatedImage?: string;
  fallback?: boolean;
  styleAnalysis?: unknown;
  movieName?: string;
  model?: string;
  error?: string;
  generatedText?: string;
}

export async function generateTitle(
  userText: string,
  userImageBase64: string,
  referenceImageBase64: string,
  movieName: string,
): Promise<GenerateTitleResult> {
  const response = await fetch("/api/generate-title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userText,
      userImageBase64,
      referenceImageBase64,
      movieName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Generation failed");
  }

  const data = await response.json();
  return data;
}

export async function analyzeReferenceStyle(
  referenceImageBase64: string,
  userText: string,
  movieName: string,
): Promise<{ styleAnalysis: string }> {
  const response = await fetch("/api/generate-title", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      referenceImageBase64,
      userText,
      movieName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Analysis failed");
  }

  const data = await response.json();
  return data;
}

// ═══════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════

/**
 * Convert File to Base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert Canvas to Base64 string
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

/**
 * Convert Image URL to Base64
 * Note: Image must have proper CORS headers or be same-origin
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}
