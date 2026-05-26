import Link from "next/link";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">✦</span>
              <span className="logo-text">FontGen</span>
            </div>
            <p className="footer-desc">
              Generate authentic Indian movie title fonts and place them on your photos in seconds.
            </p>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Pages</h4>
            <Link href="/" className="footer-link">Home</Link>
            <Link href="/fonts" className="footer-link">Browse Fonts</Link>
            <Link href="/admin" className="footer-link">Admin</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Languages</h4>
            <span className="footer-link">Hindi</span>
            <span className="footer-link">Tamil</span>
            <span className="footer-link">Telugu</span>
            <span className="footer-link">Malayalam</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} FontGen. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
