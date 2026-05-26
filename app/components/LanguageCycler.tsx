"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./LanguageCycler.css";

interface LanguageEntry {
  english: string;
  native: string;
  color: string;
  hueRotate: number; // degrees to shift the blue SVG to this color
}

// Base SVG hue is ~210° (blue). Calculate rotation to reach target hue.
const LANGUAGES: LanguageEntry[] = [
  { english: "English", native: "English", color: "#4A90D9", hueRotate: 0 }, // blue → no shift
  { english: "Hindi", native: "हिंदी", color: "#FF9933", hueRotate: 180 }, // blue → saffron
  { english: "Tamil", native: "தமிழ்", color: "#E53935", hueRotate: 150 }, // blue → red
  { english: "Telugu", native: "తెలుగు", color: "#9C27B0", hueRotate: 75 }, // blue → purple
  { english: "Malayalam", native: "മലയാളം", color: "#2E7D32", hueRotate: 280 }, // blue → green
];

const HOLD_DURATION = 5000;
const TRANSITION_MS = 400;

interface LanguageCyclerProps {
  onColorChange?: (color: string, hueRotate: number, width?: number) => void;
}

export default function LanguageCycler({ onColorChange }: LanguageCyclerProps) {
  const [langIndex, setLangIndex] = useState(0);
  const [showing, setShowing] = useState<"english" | "native">("english");
  const [textWidth, setTextWidth] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const currentLang = LANGUAGES[langIndex];
  const displayText =
    showing === "english" ? currentLang.english : currentLang.native;

  // Measure text width
  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.getBoundingClientRect().width;
      setTextWidth(width);
    }
  }, [langIndex, showing]);

  // Notify parent of color + hueRotate + width
  useEffect(() => {
    onColorChange?.(currentLang.color, currentLang.hueRotate, textWidth);
  }, [
    langIndex,
    currentLang.color,
    currentLang.hueRotate,
    onColorChange,
    textWidth,
  ]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (showing === "english") {
      timerRef.current = setTimeout(() => {
        if (currentLang.english === currentLang.native) {
          setLangIndex((prev) => (prev + 1) % LANGUAGES.length);
          setShowing("english");
        } else {
          setShowing("native");
        }
      }, HOLD_DURATION);
    } else {
      timerRef.current = setTimeout(() => {
        setLangIndex((prev) => (prev + 1) % LANGUAGES.length);
        setShowing("english");
      }, HOLD_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [langIndex, showing, currentLang.english, currentLang.native]);

  return (
    <span className="language-cycler" style={{ color: currentLang.color }}>
      <AnimatePresence mode="wait">
        <motion.span
          ref={textRef}
          key={`${langIndex}-${showing}`}
          className="language-word"
          initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(12px)" }}
          transition={{
            duration: TRANSITION_MS / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {displayText}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
