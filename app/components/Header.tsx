"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Header.css";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">FontGen</span>
        </Link>
        <nav className="nav-links">
          <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
            Home
          </Link>
          <Link href="/fonts" className={`nav-link ${pathname === "/fonts" ? "active" : ""}`}>
            Fonts
          </Link>
          <Link href="/admin" className={`nav-link nav-admin ${pathname === "/admin" ? "active" : ""}`}>
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
