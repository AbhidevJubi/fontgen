export interface MovieFont {
  id: string;
  movieName: string;
  language: string;
  actor: string;
  year: number;
  image: string;
  titleImage: string; // transparent PNG of movie title (simulated)
  sampleImages: string[];
  featured: boolean;
}

export const LANGUAGES = ["Hindi", "Tamil", "Telugu", "Malayalam"] as const;

export const ACTORS = [
  "Shah Rukh Khan",
  "Prabhas",
  "Vijay",
  "Suriya",
  "Mohanlal",
  "Allu Arjun",
  "Ranbir Kapoor",
  "Hrithik Roshan",
] as const;

export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025] as const;

export const MOCK_FONTS: MovieFont[] = [
  {
    id: "1",
    movieName: "Pathaan",
    language: "Hindi",
    actor: "Shah Rukh Khan",
    year: 2023,
    image: "/images/hero1.jpg",
    titleImage: "/images/hero1.jpg",
    sampleImages: [
      "/images/hero2.jpg",
      "/images/hero3.jpg",
      "/images/hero4.jpg",
    ],
    featured: true,
  },
  {
    id: "2",
    movieName: "Jawan",
    language: "Hindi",
    actor: "Shah Rukh Khan",
    year: 2023,
    image: "/images/hero2.jpg",
    titleImage: "/images/hero2.jpg",
    sampleImages: [
      "/images/hero1.jpg",
      "/images/hero3.jpg",
      "/images/hero5.jpg",
    ],
    featured: true,
  },
  {
    id: "3",
    movieName: "Kalki 2898 AD",
    language: "Telugu",
    actor: "Prabhas",
    year: 2024,
    image: "/images/hero3.jpg",
    titleImage: "/images/hero3.jpg",
    sampleImages: [
      "/images/hero1.jpg",
      "/images/hero2.jpg",
      "/images/hero4.jpg",
    ],
    featured: true,
  },
  {
    id: "4",
    movieName: "Animal",
    language: "Hindi",
    actor: "Ranbir Kapoor",
    year: 2023,
    image: "/images/hero4.jpg",
    titleImage: "/images/hero4.jpg",
    sampleImages: [
      "/images/hero2.jpg",
      "/images/hero3.jpg",
      "/images/hero5.jpg",
    ],
    featured: true,
  },
  {
    id: "5",
    movieName: "Salaar",
    language: "Telugu",
    actor: "Prabhas",
    year: 2023,
    image: "/images/hero5.jpg",
    titleImage: "/images/hero5.jpg",
    sampleImages: [
      "/images/hero1.jpg",
      "/images/hero3.jpg",
      "/images/hero4.jpg",
    ],
    featured: true,
  },
  {
    id: "6",
    movieName: "Fighter",
    language: "Hindi",
    actor: "Hrithik Roshan",
    year: 2024,
    image: "/images/hero1.jpg",
    titleImage: "/images/hero1.jpg",
    sampleImages: [
      "/images/hero2.jpg",
      "/images/hero4.jpg",
      "/images/hero5.jpg",
    ],
    featured: true,
  },
  {
    id: "7",
    movieName: "Leo",
    language: "Tamil",
    actor: "Vijay",
    year: 2023,
    image: "/images/hero2.jpg",
    titleImage: "/images/hero2.jpg",
    sampleImages: ["/images/hero1.jpg", "/images/hero3.jpg"],
    featured: false,
  },
  {
    id: "8",
    movieName: "Kanguva",
    language: "Tamil",
    actor: "Suriya",
    year: 2024,
    image: "/images/hero3.jpg",
    titleImage: "/images/hero3.jpg",
    sampleImages: ["/images/hero2.jpg", "/images/hero5.jpg"],
    featured: false,
  },
  {
    id: "9",
    movieName: "Pushpa 2",
    language: "Telugu",
    actor: "Allu Arjun",
    year: 2024,
    image: "/images/hero4.jpg",
    titleImage: "/images/hero4.jpg",
    sampleImages: ["/images/hero1.jpg", "/images/hero3.jpg"],
    featured: false,
  },
  {
    id: "10",
    movieName: "Lucifer",
    language: "Malayalam",
    actor: "Mohanlal",
    year: 2020,
    image: "/images/hero5.jpg",
    titleImage: "/images/hero5.jpg",
    sampleImages: ["/images/hero2.jpg", "/images/hero4.jpg"],
    featured: false,
  },
  {
    id: "11",
    movieName: "Dunki",
    language: "Hindi",
    actor: "Shah Rukh Khan",
    year: 2023,
    image: "/images/hero1.jpg",
    titleImage: "/images/hero1.jpg",
    sampleImages: ["/images/hero3.jpg", "/images/hero5.jpg"],
    featured: false,
  },
  {
    id: "12",
    movieName: "GOAT",
    language: "Tamil",
    actor: "Vijay",
    year: 2024,
    image: "/images/hero2.jpg",
    titleImage: "/images/hero2.jpg",
    sampleImages: ["/images/hero1.jpg", "/images/hero4.jpg"],
    featured: false,
  },
];

export function getLocalFonts(): MovieFont[] {
  if (typeof window === "undefined") return MOCK_FONTS;
  const stored = localStorage.getItem("fontgen_fonts");
  if (!stored) {
    localStorage.setItem("fontgen_fonts", JSON.stringify(MOCK_FONTS));
    return MOCK_FONTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return MOCK_FONTS;
  }
}

export function saveLocalFonts(fonts: MovieFont[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fontgen_fonts", JSON.stringify(fonts));
    } catch (error) {
      console.warn(
        "Unable to save fonts to localStorage. This is a non-blocking fallback error:",
        error,
      );
    }
  }
}
