"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Footer from "./components/Footer";
import LanguageCycler from "./components/LanguageCycler";
import LightRays from "./components/LightRays";
import { MOCK_FONTS, getLocalFonts, MovieFont } from "./data/fonts";
import { fetchMovies } from "@/lib/api-client";
import "./page.css";

const generateUniqueId = () => String(Date.now());

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredFonts, setFeaturedFonts] = useState<MovieFont[]>([]);
  const router = useRouter();
  const [gradientColor, setGradientColor] = useState("#4A90D9");
  const [hueRotate, setHueRotate] = useState(0);
  const [languageTextWidth, setLanguageTextWidth] = useState(0);

  // Load featured fonts on component mount
  useEffect(() => {
    const loadFeaturedFonts = async () => {
      try {
        // Try fetching from Supabase first
        const movies = await fetchMovies({ featured: true });
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

        if (mappedFonts.length > 0) {
          setFeaturedFonts(mappedFonts);
          return;
        }
      } catch (error) {
        console.warn(
          "Failed to fetch featured fonts from Supabase, trying localStorage...",
          error,
        );
      }

      // Fallback to localStorage
      try {
        const localFonts = getLocalFonts();
        const featured = localFonts.filter((f) => f.featured);
        setFeaturedFonts(
          featured.length > 0 ? featured : MOCK_FONTS.filter((f) => f.featured),
        );
      } catch (error) {
        console.warn(
          "Failed to load from localStorage, using mock data",
          error,
        );
        setFeaturedFonts(MOCK_FONTS.filter((f) => f.featured));
      }
    };

    loadFeaturedFonts();
  }, []);

  const handleColorChange = useCallback(
    (color: string, hue: number, width?: number) => {
      setGradientColor(color);
      setHueRotate(hue);
      if (width !== undefined) {
        setLanguageTextWidth(width);
      }
    },
    [],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/fonts?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="home-page">
      {/* ─── HERO ─── */}
      <div className="hero-section">
        {/* LIGHT RAYS COMPONENT - Settings Configuration */}
        {/* To modify light rays settings, update the props below: */}
        {/* - raysOrigin: Origin point of light rays (e.g., 'top-center', 'top-left', 'bottom-center') */}
        {/* - raysSpeed: Speed of ray animation - ADJUST HERE: currently 0.5 */}
        {/* - lightSpread: Width spread of rays - ADJUST HERE: currently 2 */}
        {/* - rayLength: Length of rays extending - ADJUST HERE: currently 1 */}
        {/* - fadeDistance: Distance before fading - ADJUST HERE: currently 1 */}
        {/* - saturation: Color saturation (1 = full) - ADJUST HERE: currently 1 */}
        {/* - followMouse: Enable mouse interaction - ADJUST HERE: currently false */}
        {/* - mouseInfluence: How much mouse affects rays (0-1) - ADJUST HERE: currently 0 (disabled) */}
        {/* - noiseAmount: Texture noise amount - ADJUST HERE: currently 0.3 */}
        {/* - distortion: Ray distortion effect - ADJUST HERE: currently 0 */}
        <LightRays
          raysOrigin="top-center"
          raysSpeed={0.5}
          lightSpread={2}
          rayLength={1}
          fadeDistance={1}
          saturation={1}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0.3}
          distortion={0}
        />

        <div className="hero-background">
          <div
            className="hero-bg-image"
            style={{ backgroundImage: "url('/images/hero1.jpg')" }}
          />
          <div
            className="hero-bg-image"
            style={{ backgroundImage: "url('/images/hero2.jpg')" }}
          />
          <div
            className="hero-bg-image"
            style={{ backgroundImage: "url('/images/hero3.jpg')" }}
          />
          <div
            className="hero-bg-image"
            style={{ backgroundImage: "url('/images/hero4.jpg')" }}
          />
          <div
            className="hero-bg-image"
            style={{ backgroundImage: "url('/images/hero5.jpg')" }}
          />
        </div>
        <div className="hero-overlay" />

        <div className="group">
          <h1
            className="text-wrapper"
            style={
              {
                "--language-width": `${languageTextWidth}px`,
              } as React.CSSProperties
            }
          >
            Generate Authentic{" "}
            <LanguageCycler onColorChange={handleColorChange} />
            <br />
            Movie Fonts
          </h1>
          <p className="turn-any-photo-into">
            Turn any photo into a blockbuster movie poster.
            <br />
            Upload your image and add real Indian cinema title fonts in seconds.
          </p>

          <form className="search-container-with-glow" onSubmit={handleSearch}>
            <div
              className="gradient-glow-wrap"
              style={
                { "--hue-rotate": `${hueRotate}deg` } as React.CSSProperties
              }
            >
              <img
                className="dynamic-gradient"
                alt=""
                src="/svgs/dynamic-gradient-fill-blured300.svg"
                width={1257}
                height={675}
              />
              <img
                className="img"
                alt=""
                src="/svgs/dynamic-gradient-fill-blured100.svg"
                width={846}
                height={264}
              />
            </div>
            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Search by movie name, actor & language"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search" aria-label="Search">
                <Image
                  className="search-2"
                  alt="Search"
                  src="/svgs/search.svg"
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </form>

          <div className="div">
            <Link href="/fonts" className="explore-all-fonts">
              <span className="text-wrapper-2">Explore All Fonts</span>
            </Link>
            <a href="#featured" className="see-featured-movies">
              <span className="text-wrapper-3">See Featured Movies</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── FEATURED FONTS ─── */}
      <section className="featured-fonts" id="featured">
        <div className="group-2">
          <h2 className="section-title">Featured Movie Fonts</h2>
          <div className="font-grid">
            {featuredFonts.map((font) => (
              <Link
                href={`/fonts?search=${encodeURIComponent(font.movieName)}`}
                key={font.id}
                className="font-card"
                style={{ backgroundImage: `url('${font.image}')` }}
              >
                <div className="font-card-gradient" />
                <div className="font-card-content">
                  <span className="font-card-name">{font.movieName}</span>
                  <span className="font-card-btn">Try Now</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <Link href="/fonts" className="cta-outline">
          Explore All Fonts
        </Link>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="features-section" id="features">
        <div className="features-grid">
          {/* Card 1: Purple */}
          <div className="feature-card theme-purple">
            <div className="feature-glow"></div>
            <div className="feature-bg-wrapper">
              <svg
                className="bg-graphic"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMaxYMax slice"
              >
                <g
                  transform="rotate(20) translate(20, -40)"
                  fill="rgba(168, 85, 247, 0.1)"
                >
                  <rect x="0" y="0" width="30" height="150" />
                  {[...Array(10)].map((_, i) => (
                    <rect
                      key={`l-${i}`}
                      x="2"
                      y={i * 15 + 2}
                      width="4"
                      height="6"
                      fill="#000"
                    />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <rect
                      key={`r-${i}`}
                      x="24"
                      y={i * 15 + 2}
                      width="4"
                      height="6"
                      fill="#000"
                    />
                  ))}
                </g>
              </svg>
            </div>
            <div className="feature-content">
              <div className="feature-icon-box">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                </svg>
              </div>
              <h3 className="feature-name">
                <span className="highlight">100+</span> Movie Fonts
              </h3>
              <p className="feature-desc">
                Access an ever-growing library of authentic Indian cinema title
                fonts across Hindi, Tamil, Telugu &amp; Malayalam.
              </p>
            </div>
          </div>

          {/* Card 2: Orange */}
          <div className="feature-card theme-orange">
            <div className="feature-glow"></div>
            <div className="feature-bg-wrapper">
              <svg
                className="bg-graphic"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMaxYMax slice"
              >
                <g stroke="rgba(249, 115, 22, 0.2)" strokeWidth="1">
                  {[...Array(15)].map((_, i) => (
                    <line key={i} x1="0" y1={100 + i * 8} x2="100" y2={i * 8} />
                  ))}
                  {[...Array(5)].map((_, i) => (
                    <line
                      key={`thick-${i}`}
                      x1="0"
                      y1={80 + i * 15}
                      x2="100"
                      y2={i * 15 - 20}
                      strokeWidth="2"
                      stroke="rgba(249, 115, 22, 0.4)"
                    />
                  ))}
                </g>
              </svg>
            </div>
            <div className="feature-content">
              <div className="feature-icon-box">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                </svg>
              </div>
              <h3 className="feature-name">
                <span className="highlight">Instant</span> Generation
              </h3>
              <p className="feature-desc">
                Powered by AI image generation — type your text and get your
                poster-ready title in seconds.
              </p>
            </div>
          </div>

          {/* Card 3: Cyan */}
          <div className="feature-card theme-cyan">
            <div className="feature-glow"></div>
            <div className="feature-bg-wrapper">
              <svg
                className="bg-graphic"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMaxYMax slice"
              >
                <path
                  d="M-20 100 L 30 40 L 50 70 L 80 20 L 120 100 Z"
                  fill="rgba(6, 182, 212, 0.1)"
                />
                <path
                  d="M10 100 L 50 60 L 70 80 L 100 40 L 130 100 Z"
                  fill="rgba(6, 182, 212, 0.15)"
                />
              </svg>
            </div>
            <div className="feature-content">
              <div className="feature-icon-box">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
              </div>
              <h3 className="feature-name">Upload Your Image</h3>
              <p className="feature-desc">
                Upload any photo and place your generated movie title directly
                on it. Adjust size &amp; position for a perfect fit.
              </p>
            </div>
          </div>

          {/* Card 4: Pink */}
          <div className="feature-card theme-pink">
            <div className="feature-glow"></div>
            <div className="feature-bg-wrapper">
              <svg
                className="bg-graphic"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMaxYMax slice"
              >
                <g
                  transform="translate(80, 70) scale(1.5)"
                  fill="rgba(236, 72, 153, 0.05)"
                  stroke="rgba(236, 72, 153, 0.2)"
                  strokeWidth="2"
                >
                  <circle cx="0" cy="0" r="30" />
                  <circle cx="0" cy="0" r="5" />
                  {[...Array(5)].map((_, i) => {
                    const angle = (i * 72 * Math.PI) / 180;
                    // Round to 2 decimal places to avoid hydration mismatch
                    const cx = Math.round(Math.cos(angle) * 18 * 100) / 100;
                    const cy = Math.round(Math.sin(angle) * 18 * 100) / 100;
                    return <circle key={i} cx={cx} cy={cy} r="8" />;
                  })}
                </g>
              </svg>
            </div>
            <div className="feature-content">
              <div className="feature-icon-box">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
              </div>
              <h3 className="feature-name">
                <span className="highlight">Download</span> Instantly
              </h3>
              <p className="feature-desc">
                Get your final poster as a high-quality JPG image — ready to
                share on social media or print.
              </p>
            </div>
          </div>

          {/* Card 5: Blue */}
          <div className="feature-card theme-blue">
            <div className="feature-glow"></div>
            <div className="feature-bg-wrapper">
              <svg
                className="bg-graphic"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMaxYMax slice"
              >
                <g
                  stroke="rgba(59, 130, 246, 0.2)"
                  fill="none"
                  strokeWidth="0.5"
                >
                  {[...Array(20)].map((_, i) => (
                    <path
                      key={i}
                      d={`M-20 ${80 + i * 2} Q 40 ${30 + i * 5} 120 ${80 + i * 2}`}
                    />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <path
                      key={`w-${i}`}
                      d={`M-20 ${90 + i * 2} Q 50 ${60 + i * 3} 120 ${100 + i * 2}`}
                      stroke="rgba(59, 130, 246, 0.4)"
                      strokeWidth="1"
                    />
                  ))}
                </g>
              </svg>
            </div>
            <div className="feature-content">
              <div className="feature-icon-box">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
              <h3 className="feature-name">
                <span className="highlight">Smart</span> Search
              </h3>
              <p className="feature-desc">
                Search fonts by movie name, actor, language, or year. Find the
                perfect style in seconds.
              </p>
            </div>
          </div>

          {/* Card 6: Green */}
          <div className="feature-card theme-green">
            <div className="feature-glow"></div>
            <div className="feature-bg-wrapper">
              <svg
                className="bg-graphic"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMaxYMax slice"
              >
                <g transform="translate(60, 20) scale(1.2)">
                  <path
                    d="M15 0 L 30 5 L 30 20 C 30 35 15 45 15 45 C 15 45 0 35 0 20 L 0 5 Z"
                    fill="rgba(34, 197, 94, 0.05)"
                    stroke="rgba(34, 197, 94, 0.3)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 20 L 13 25 L 22 14"
                    fill="none"
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>
            <div className="feature-content">
              <div className="feature-icon-box text-icon">
                <span>FREE</span>
              </div>
              <h3 className="feature-name">No Account Needed</h3>
              <p className="feature-desc">
                No sign-up, no login. We never store your images or personal
                data. Just create and download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW TO ─── */}
      <section className="howto-section" id="howto">
        <h2 className="section-title">How It Works</h2>
        <div className="howto-steps">
          <div className="howto-step">
            <div className="step-number">01</div>
            <h3 className="step-title">Pick a Movie Font</h3>
            <p className="step-desc">
              Browse our library or search for a specific movie. Click &quot;Try
              Now&quot; on any font card.
            </p>
          </div>
          <div className="howto-connector" />
          <div className="howto-step">
            <div className="step-number">02</div>
            <h3 className="step-title">Enter Your Text &amp; Upload</h3>
            <p className="step-desc">
              Type the text you want styled, then upload a background image or
              choose from our presets.
            </p>
          </div>
          <div className="howto-connector" />
          <div className="howto-step">
            <div className="step-number">03</div>
            <h3 className="step-title">Adjust &amp; Download</h3>
            <p className="step-desc">
              Resize and position the generated title on your image, then
              download the final result.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <Footer />
    </div>
  );
}
