"use client";

import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import {
  MovieFont,
  getLocalFonts,
  saveLocalFonts,
  LANGUAGES,
  ACTORS,
  YEARS,
} from "../data/fonts";
import { uploadImage, createMovie, updateMovie } from "@/lib/api-client";
import "./admin.css";

const generateUniqueId = () => String(Date.now());

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Font data state
  const [fonts, setFonts] = useState<MovieFont[]>([]);

  // Form states
  const [movieName, setMovieName] = useState("");
  const [language, setLanguage] = useState("");
  const [actor, setActor] = useState("");
  const [year, setYear] = useState(2025);
  const [customLanguage, setCustomLanguage] = useState("");
  const [customActor, setCustomActor] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState(""); // main background image preview
  const [titleImage, setTitleImage] = useState(""); // transparent logo title image preview
  const [sampleImages, setSampleImages] = useState<string[]>([]); // preset backgrounds
  const [titleImageFile, setTitleImageFile] = useState<File | null>(null);
  const [sampleImageFiles, setSampleImageFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Editing state
  const [editId, setEditId] = useState<string | null>(null);

  const availableLanguages = Array.from(
    new Set([...LANGUAGES, ...fonts.map((f) => f.language)]),
  );
  const availableActors = Array.from(
    new Set([...ACTORS, ...fonts.map((f) => f.actor)]),
  );
  const availableYears = Array.from(
    new Set([...YEARS.map(String), ...fonts.map((f) => String(f.year))]),
  )
    .sort((a, b) => b.localeCompare(a))
    .map(Number);

  // Sorting and Filtering in the Admin Panel
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedActor, setSelectedActor] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [sortBy, setSortBy] = useState("year-desc");

  // Load from local storage dynamically
  useEffect(() => {
    const loadedFonts = getLocalFonts();
    const storedAuth =
      typeof window !== "undefined"
        ? sessionStorage.getItem("fontgen_admin_auth")
        : null;

    // Delay state updates to avoid synchronous cascading renders
    setTimeout(() => {
      setFonts(loadedFonts);
      if (storedAuth === "true") {
        setIsLoggedIn(true);
      }
    }, 0);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@fontgen.com" && password === "admin123") {
      setIsLoggedIn(true);
      sessionStorage.setItem("fontgen_admin_auth", "true");
      setLoginError("");
    } else {
      setLoginError(
        "Invalid email or password. Please use admin@fontgen.com / admin123",
      );
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("fontgen_admin_auth");
    setEmail("");
    setPassword("");
  };

  // Convert uploaded title transparent PNG/JPG to Base64 and save file for upload
  const handleTitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTitleImage(ev.target?.result as string);
        setTitleImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert uploaded sample background to Base64 and save file for upload
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setImage(base64);
        // Automatically add to sample backgrounds list
        setSampleImages((prev) => {
          if (prev.includes(base64)) return prev;
          return [...prev, base64];
        });
        setSampleImageFiles((prev) => [...prev, file]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieName.trim()) return alert("Please enter the movie name");

    const chosenLanguage = customLanguage.trim() || language;
    const chosenActor = customActor.trim() || actor;
    const chosenYear = customYear ? Number(customYear) : year;

    if (!chosenLanguage.trim()) return alert("Please enter a language.");
    if (!chosenActor.trim()) return alert("Please enter an actor.");
    if (!chosenYear || Number.isNaN(chosenYear))
      return alert("Please enter a valid year.");

    setIsSaving(true);

    try {
      const movieTitleSlug = movieName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/-+/g, "-");

      let titleImageUrl = titleImage || "/images/hero1.jpg";
      if (titleImageFile) {
        const titleFileExtension =
          titleImageFile.name.split(".").pop() || "png";
        const titleFileName = `${movieTitleSlug}-title.${titleFileExtension}`;
        const uploadResult = await uploadImage(
          titleImageFile,
          "movie-titles",
          titleFileName,
        );
        titleImageUrl = uploadResult.url;
      }

      const finalSampleUrls = await Promise.all(
        sampleImages.map(async (sample, index) => {
          const sampleFile = sampleImageFiles[index];
          if (sampleFile) {
            const sampleFileExtension =
              sampleFile.name.split(".").pop() || "jpg";
            const sampleFileName = `${movieTitleSlug}-sample-${index + 1}.${sampleFileExtension}`;
            const uploadResult = await uploadImage(
              sampleFile,
              "sample-backgrounds",
              sampleFileName,
            );
            return uploadResult.url;
          }
          return sample;
        }),
      );

      const movieData = {
        movieName: movieName.trim(),
        language: chosenLanguage,
        actor: chosenActor,
        year: chosenYear,
        featured,
        titleImageUrl,
        sampleImagesUrls:
          finalSampleUrls.length > 0
            ? finalSampleUrls
            : ["/images/hero2.jpg", "/images/hero3.jpg"],
      };

      let createdMovieId = editId;
      if (editId) {
        await updateMovie({ id: editId, ...movieData });
        alert("Movie font saved successfully.");
      } else {
        const createdMovie = await createMovie(movieData);
        createdMovieId = createdMovie.id;
        alert("Movie font saved successfully.");
      }

      const updatedFonts = editId
        ? fonts.map((font) =>
            font.id === editId
              ? {
                  ...font,
                  movieName: movieName.trim(),
                  language: chosenLanguage,
                  actor: chosenActor,
                  year: chosenYear,
                  featured,
                  image: image || "/images/hero1.jpg",
                  titleImage: titleImageUrl,
                  sampleImages: finalSampleUrls,
                }
              : font,
          )
        : [
            {
              id: createdMovieId,
              movieName: movieName.trim(),
              language: chosenLanguage,
              actor: chosenActor,
              year: chosenYear,
              featured,
              image: image || "/images/hero1.jpg",
              titleImage: titleImageUrl,
              sampleImages: finalSampleUrls,
            },
            ...fonts,
          ];

      setFonts(updatedFonts);
      saveLocalFonts(updatedFonts);
      resetForm();
    } catch (err) {
      console.error("Admin save error:", err);
      alert(
        err instanceof Error
          ? `Unable to save movie: ${err.message}`
          : "Unable to save movie",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (font: MovieFont) => {
    setEditId(font.id);
    setMovieName(font.movieName);
    setLanguage(font.language);
    setActor(font.actor);
    setYear(font.year);
    setCustomLanguage("");
    setCustomActor("");
    setCustomYear("");
    setFeatured(font.featured);
    setImage(font.image);
    setTitleImage(font.titleImage);
    setSampleImages(font.sampleImages);
    setTitleImageFile(null);
    setSampleImageFiles([]);

    // Smooth scroll up to form panel
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this font card?")) return;
    const updated = fonts.filter((f) => f.id !== id);
    setFonts(updated);
    saveLocalFonts(updated);
    if (editId === id) resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setMovieName("");
    setLanguage("");
    setActor("");
    setYear(2025);
    setCustomLanguage("");
    setCustomActor("");
    setCustomYear("");
    setFeatured(false);
    setImage("");
    setTitleImage("");
    setSampleImages([]);
    setTitleImageFile(null);
    setSampleImageFiles([]);
  };

  // Inventory Filtering & Sorting logic
  const filteredFonts = fonts.filter((font) => {
    const matchesSearch =
      font.movieName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.language.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage =
      selectedLanguage === "All" || font.language === selectedLanguage;
    const matchesActor =
      selectedActor === "All" || font.actor === selectedActor;
    const matchesYear =
      selectedYear === "All" || String(font.year) === selectedYear;

    return matchesSearch && matchesLanguage && matchesActor && matchesYear;
  });

  const sortedFonts = [...filteredFonts].sort((a, b) => {
    if (sortBy === "year-desc") return b.year - a.year;
    if (sortBy === "year-asc") return a.year - b.year;
    if (sortBy === "alpha-asc") return a.movieName.localeCompare(b.movieName);
    if (sortBy === "alpha-desc") return b.movieName.localeCompare(a.movieName);
    return 0;
  });

  // Extract unique items in existing list for admin side searches
  const uniqueLanguages = [
    "All",
    ...Array.from(new Set(fonts.map((f) => f.language))),
  ];
  const uniqueActors = [
    "All",
    ...Array.from(new Set(fonts.map((f) => f.actor))),
  ];
  const uniqueYears = [
    "All",
    ...Array.from(new Set(fonts.map((f) => String(f.year)))),
  ].sort((a, b) => b.localeCompare(a));

  return (
    <div className="admin-page">
      {/* ─── LOGIN CARD ─── */}
      {!isLoggedIn ? (
        <div className="admin-login-container">
          <form className="login-card" onSubmit={handleLogin}>
            <span className="login-logo">🔒</span>
            <h1 className="login-title">FontGen Console</h1>
            <p className="login-subtitle">
              Sign in to manage and upload movie fonts.
            </p>

            {loginError && <div className="login-error-msg">{loginError}</div>}

            <div className="form-group" style={{ textAlign: "left" }}>
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                required
                placeholder="admin@fontgen.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ textAlign: "left" }}>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="login-btn">
              Authenticate
            </button>
          </form>
        </div>
      ) : (
        /* ─── ADMIN DASHBOARD CONTROLS ─── */
        <div className="admin-dashboard">
          {/* Header */}
          <header className="admin-header">
            <div>
              <h1 className="admin-header-title">
                Dashboard <span className="admin-badge">Super Admin</span>
              </h1>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </header>

          {/* CREATE / EDIT FORM PANEL */}
          <section className={`form-panel ${editId ? "edit-mode-active" : ""}`}>
            <h2 className="form-panel-title">
              {editId ? "Modify Movie Font" : "Create New Movie Font"}
              {editId && <span className="edit-mode-tag">Editing mode</span>}
            </h2>

            <form onSubmit={handleCreateOrUpdate} className="admin-form">
              <div className="form-row-grid">
                {/* Movie Name */}
                <div className="form-group">
                  <label className="form-label">Movie Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Kalki 2898 AD"
                    required
                    value={movieName}
                    onChange={(e) => setMovieName(e.target.value)}
                  />
                </div>

                {/* Language Select */}
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select
                    className="form-input"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="">None selected</option>
                    {availableLanguages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actor Select */}
                <div className="form-group">
                  <label className="form-label">Main Actor / Hero</label>
                  <select
                    className="form-input"
                    value={actor}
                    onChange={(e) => setActor(e.target.value)}
                  >
                    <option value="">None selected</option>
                    {availableActors.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-grid">
                {/* Custom New Entry Fields */}
                <div className="form-group">
                  <label className="form-label">Add New Language</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type new language (optional)"
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Add New Actor / Hero</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type new actor (optional)"
                    value={customActor}
                    onChange={(e) => setCustomActor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Add New Year</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 2026"
                    min="1900"
                    max="2100"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-grid">
                {/* Year Select */}
                <div className="form-group">
                  <label className="form-label">Release Year</label>
                  <select
                    className="form-input"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkbox Featured */}
                <div
                  className="form-group"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <div
                    className="featured-checkbox-wrap"
                    onClick={() => setFeatured(!featured)}
                  >
                    <div
                      className={`custom-checkbox ${featured ? "checked" : ""}`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#000"
                        strokeWidth="4"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="checkbox-label">
                      Promote to Featured Section
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Blocks */}
              <div className="upload-grid">
                {/* Official Movie Title upload */}
                <div className="form-group">
                  <label className="form-label">
                    Movie Title Transparent Logo (PNG/JPG)
                  </label>
                  <div
                    className="admin-upload-zone"
                    onClick={() =>
                      document.getElementById("admin-title-upload")?.click()
                    }
                  >
                    {titleImage ? (
                      <img
                        src={titleImage}
                        alt="Title Logo"
                        className="upload-preview-square"
                      />
                    ) : (
                      <>
                        <span className="upload-icon">📂</span>
                        <span
                          className="upload-text"
                          style={{ fontSize: "11px" }}
                        >
                          Click to upload logo
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    id="admin-title-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    style={{ display: "none" }}
                    onChange={handleTitleUpload}
                  />
                </div>

                {/* Background sample image upload */}
                <div className="form-group">
                  <label className="form-label">
                    Upload Poster Background Images (PNG/JPG)
                  </label>
                  <div
                    className="admin-upload-zone"
                    onClick={() =>
                      document.getElementById("admin-bg-upload")?.click()
                    }
                  >
                    {image ? (
                      <img
                        src={image}
                        alt="Background Poster"
                        className="upload-preview-square"
                      />
                    ) : (
                      <>
                        <span className="upload-icon">🏞️</span>
                        <span
                          className="upload-text"
                          style={{ fontSize: "11px" }}
                        >
                          Click to upload background
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    id="admin-bg-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    style={{ display: "none" }}
                    onChange={handleBackgroundUpload}
                  />

                  {/* Sample backgrounds thumbnails list */}
                  {sampleImages.length > 0 && (
                    <div className="sample-previews">
                      {sampleImages.map((s, idx) => (
                        <img
                          key={idx}
                          src={s}
                          alt={`thumbnail ${idx}`}
                          className="sample-preview-thumbnail"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form buttons */}
              <div className="form-actions-wrap">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving…"
                    : editId
                      ? "Save Font Changes"
                      : "Create & Add Font"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  {editId ? "Cancel Edit" : "Reset Form"}
                </button>
              </div>
            </form>
          </section>

          {/* MANAGE PREVIOUS FONTS PANEL */}
          <section className="list-panel">
            <h2 className="list-panel-title">Manage Inventory</h2>

            {/* Sorting, Filtering, and Searching in Admin Inventory Panel */}
            <div
              className="filter-panel"
              style={{ padding: "20px", marginBottom: "24px" }}
            >
              <div className="filter-row-top" style={{ gap: "10px" }}>
                {/* Search */}
                <div className="search-bar-wrap">
                  <svg
                    className="search-icon-svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    className="search-input-field"
                    style={{ height: "42px", fontSize: "13px" }}
                    placeholder="Search movie title to edit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Sort dropdown */}
                <div className="sort-wrap">
                  <span className="sort-label">Sort:</span>
                  <select
                    className="sort-select"
                    style={{ height: "40px", fontSize: "12px" }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="year-desc">Year: Newest First</option>
                    <option value="year-asc">Year: Oldest First</option>
                    <option value="alpha-asc">Movie: A to Z</option>
                    <option value="alpha-desc">Movie: Z to A</option>
                  </select>
                </div>
              </div>

              {/* Filtering row */}
              <div
                className="filter-row-bottom"
                style={{
                  gridTemplateColumns: "repeat(3, 1fr)",
                  paddingTop: "15px",
                  gap: "10px",
                }}
              >
                <div className="select-filter-group">
                  <select
                    className="filter-select"
                    style={{ height: "40px", fontSize: "12px" }}
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    {uniqueLanguages.map((l) => (
                      <option key={l} value={l}>
                        {l === "All" ? "All Languages" : l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-filter-group">
                  <select
                    className="filter-select"
                    style={{ height: "40px", fontSize: "12px" }}
                    value={selectedActor}
                    onChange={(e) => setSelectedActor(e.target.value)}
                  >
                    {uniqueActors.map((a) => (
                      <option key={a} value={a}>
                        {a === "All" ? "All Actors" : a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-filter-group">
                  <select
                    className="filter-select"
                    style={{ height: "40px", fontSize: "12px" }}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {uniqueYears.map((y) => (
                      <option key={y} value={y}>
                        {y === "All" ? "All Years" : y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory Count */}
            <div
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "15px",
                padding: "0 5px",
              }}
            >
              Found {sortedFonts.length} records matching search
            </div>

            {/* Fonts Inventory Table List */}
            {sortedFonts.length > 0 ? (
              <div className="admin-fonts-list">
                {sortedFonts.map((font) => (
                  <div key={font.id} className="admin-font-row">
                    <div className="admin-row-left">
                      <img
                        src={font.image}
                        alt={font.movieName}
                        className="admin-row-thumb"
                      />
                      <div className="admin-row-info">
                        <h3 className="admin-row-title">
                          {font.movieName}
                          {font.featured && (
                            <span
                              className="admin-badge"
                              style={{
                                fontSize: "9px",
                                padding: "2px 6px",
                                marginLeft: "8px",
                              }}
                            >
                              Featured
                            </span>
                          )}
                        </h3>
                        <span className="admin-row-meta">
                          {font.language} • {font.actor} • {font.year}
                        </span>
                      </div>
                    </div>

                    <div className="admin-row-actions">
                      <button
                        className="action-edit-btn"
                        onClick={() => startEdit(font)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-delete-btn"
                        onClick={() => handleDelete(font.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="fonts-empty-state"
                style={{ padding: "40px 20px" }}
              >
                <span className="empty-icon" style={{ fontSize: "30px" }}>
                  📁
                </span>
                <h3 className="empty-title" style={{ fontSize: "16px" }}>
                  No Fonts Found
                </h3>
                <p className="empty-desc" style={{ fontSize: "12px" }}>
                  No inventory match found.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
