"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "../components/Footer";
import FontLightbox from "../components/FontLightbox";
import { MovieFont, getLocalFonts } from "../data/fonts";
import { fetchMovies } from "@/lib/api-client";
import "./fonts.css";

const generateUniqueId = () => String(Date.now());

export default function FontsPage() {
  const [fonts, setFonts] = useState<MovieFont[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedActor, setSelectedActor] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [sortBy, setSortBy] = useState("year-desc");
  const [selectedFont, setSelectedFont] = useState<MovieFont | null>(null);

  // Initialize and load fonts dynamically from localStorage and Supabase
  useEffect(() => {
    let initialSearch = "";

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("search");
      if (query) {
        initialSearch = query;
      }
    }

    const loadFonts = async () => {
      try {
        // Prioritize loading from Supabase API
        console.log("📡 Fetching fonts from Supabase...");
        const movies = await fetchMovies();

        if (movies && movies.length > 0) {
          const mappedFonts: MovieFont[] = movies.map((movie) => ({
            id: movie.id || generateUniqueId(),
            movieName: movie.movieName,
            language: movie.language,
            actor: movie.actor,
            year: movie.year,
            featured: movie.featured,
            image: movie.sampleImagesUrls?.[0] || "/images/hero1.jpg",
            titleImage: movie.titleImageUrl,
            sampleImages: movie.sampleImagesUrls || [],
          }));

          console.log("✅ Loaded fonts from Supabase:", mappedFonts.length);
          setFonts(mappedFonts);
          return;
        }
      } catch (error) {
        console.warn(
          "⚠️ Failed to load movie fonts from Supabase, falling back to localStorage.",
          error,
        );
      }

      // Fallback to localStorage if API fails
      try {
        console.log("📂 Loading fonts from localStorage...");
        const loadedFonts = getLocalFonts();
        if (loadedFonts && loadedFonts.length > 0) {
          console.log("✅ Loaded fonts from localStorage:", loadedFonts.length);
          setFonts(loadedFonts);
          return;
        }
      } catch (error) {
        console.warn("Failed to load from localStorage", error);
      }

      // Final fallback to empty state
      console.log("⚠️ No fonts available, using empty state");
      setFonts([]);
    };

    // Use a small timeout to ensure component is mounted before state updates
    setTimeout(() => {
      loadFonts();
      if (initialSearch) {
        setSearchQuery(initialSearch);
      }
    }, 100);
  }, []);

  // Dynamically extract active filter options from the current fonts list
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

  // Filtering Logic
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

  // Sorting Logic
  const sortedFonts = [...filteredFonts].sort((a, b) => {
    if (sortBy === "year-desc") return b.year - a.year;
    if (sortBy === "year-asc") return a.year - b.year;
    if (sortBy === "alpha-asc") return a.movieName.localeCompare(b.movieName);
    if (sortBy === "alpha-desc") return b.movieName.localeCompare(a.movieName);
    return 0;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLanguage("All");
    setSelectedActor("All");
    setSelectedYear("All");
    setSortBy("year-desc");
  };

  return (
    <div className="fonts-page">
      {/* ─── HEADER ─── */}
      <header className="fonts-header">
        <h1 className="fonts-title">Movie Title Fonts</h1>
        <p className="fonts-subtitle">
          Browse and filter authentic cinema style fonts. Enter your text and
          place them on your favorite posters in seconds.
        </p>
      </header>

      {/* ─── FILTERS ─── */}
      <section className="filter-panel">
        <div className="filter-row-top">
          {/* Search */}
          <div className="search-bar-wrap">
            <svg
              className="search-icon-svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input-field"
              placeholder="Search movies, actors, languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sorting */}
          <div className="sort-wrap">
            <span className="sort-label">Sort By:</span>
            <select
              className="sort-select"
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

        {/* Dynamic Filters */}
        <div className="filter-row-bottom">
          {/* Language */}
          <div className="select-filter-group">
            <span className="select-filter-label">Language</span>
            <select
              className="filter-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {uniqueLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === "All" ? "All Languages" : lang}
                </option>
              ))}
            </select>
          </div>

          {/* Actor */}
          <div className="select-filter-group">
            <span className="select-filter-label">Actor / Hero</span>
            <select
              className="filter-select"
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
            >
              {uniqueActors.map((act) => (
                <option key={act} value={act}>
                  {act === "All" ? "All Actors" : act}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="select-filter-group">
            <span className="select-filter-label">Year</span>
            <select
              className="filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr === "All" ? "All Years" : yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Filter Statistics */}
      <div className="filter-stats-bar">
        <span>
          Showing {sortedFonts.length} of {fonts.length} movie fonts
        </span>
        {(searchQuery ||
          selectedLanguage !== "All" ||
          selectedActor !== "All" ||
          selectedYear !== "All") && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* ─── FONTS GRID / LIST ─── */}
      {sortedFonts.length > 0 ? (
        <div className="fonts-grid-view">
          {sortedFonts.map((font) => (
            <div
              key={font.id}
              className="grid-card"
              onClick={() => setSelectedFont(font)}
            >
              <div
                className="card-image-bg"
                style={{
                  backgroundImage: `url('${font.sampleImages?.[0] || font.image}')`,
                }}
              />
              <div className="grid-card-gradient" />

              {/* Badges overlay */}
              <div className="card-badges">
                {font.featured && (
                  <span className="card-badge featured">Featured</span>
                )}
                <span className="card-badge">{font.language}</span>
                <span className="card-badge">{font.year}</span>
              </div>

              {/* Bottom Card Content */}
              <div className="grid-card-content">
                <span className="grid-card-sub">{font.actor}</span>
                <div className="grid-card-main">
                  <h2 className="grid-card-name">{font.movieName}</h2>
                  <span className="grid-card-btn">Try Now</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="fonts-empty-state">
          <span className="empty-icon">🔍</span>
          <h3 className="empty-title">No Movie Fonts Found</h3>
          <p className="empty-desc">
            Try resetting your filters or search term to see more results.
          </p>
        </div>
      )}

      {/* ─── LIGHTBOX POPUP ─── */}
      {selectedFont && (
        <FontLightbox
          font={selectedFont}
          onClose={() => setSelectedFont(null)}
        />
      )}

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
