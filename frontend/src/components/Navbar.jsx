import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Container from './Container';
import Button from './Button';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';
import { MenuIcon, CloseIcon, MedicalCrossIcon } from './icons';

export default function Navbar() {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { key: 'product', href: '#hero' },
    { key: 'features', href: '#features' },
    { key: 'howItWorks', href: '#how-it-works' },
    { key: 'testimonials', href: '#testimonials' },
  ];

  return (
    <header className="navbar">
      <Container className="navbar-inner">
        <a href="#hero" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <MedicalCrossIcon />
          </span>
          <span className="brand-text">
            <span className="brand-name font-display">{t.brandName}</span>
            <span className="brand-sub">{t.brandSub}</span>
          </span>
        </a>

        <nav className="navbar-links" aria-label="Primary">
          {links.map((link) => (
            <a key={link.key} href={link.href}>
              {t.nav[link.key]}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          <ThemeToggle />
          <LanguageToggle />

          {isAuthenticated ? (
            <Button as={Link} to="/app" variant="primary" size="sm">
              {user?.name ? `${user.name.split(' ')[0]} (Workspace)` : 'Open Workspace'}
            </Button>
          ) : (
            <>
              <Link to="/login" className="navbar-signin">
                {t.nav.signIn}
              </Link>
              <Button as={Link} to="/register" variant="primary" size="sm">
                {t.nav.getStarted}
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="navbar-burger"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <CloseIcon width={20} height={20} /> : <MenuIcon width={20} height={20} />}
        </button>
      </Container>

      {open && (
        <div className="navbar-mobile">
          <Container className="navbar-mobile-inner">
            {links.map((link) => (
              <a key={link.key} href={link.href} onClick={() => setOpen(false)}>
                {t.nav[link.key]}
              </a>
            ))}
            <div className="navbar-mobile-actions">
              <ThemeToggle />
              <LanguageToggle />
              {isAuthenticated ? (
                <Button
                  as={Link}
                  to="/app"
                  variant="primary"
                  onClick={() => setOpen(false)}
                >
                  Open Workspace
                </Button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="navbar-signin"
                    onClick={() => setOpen(false)}
                  >
                    {t.nav.signIn}
                  </Link>
                  <Button
                    as={Link}
                    to="/register"
                    variant="primary"
                    onClick={() => setOpen(false)}
                  >
                    {t.nav.getStarted}
                  </Button>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}