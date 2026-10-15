import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Container from './Container';
import Button from './Button';
import { ArrowIcon, PlayIcon } from './icons';

function StatusBadge({ status, tone }) {
  return <span className={`mini-badge mini-badge-${tone}`}>{status}</span>;
}

export default function Hero() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const h = t.hero;

  const appointments = [
    { name: h.apt1Name, meta: h.apt1Meta, status: h.apt1Status, tone: 'confirmed' },
    { name: h.apt2Name, meta: h.apt2Meta, status: h.apt2Status, tone: 'pending' },
    { name: h.apt3Name, meta: h.apt3Meta, status: h.apt3Status, tone: 'confirmed' },
  ];

  return (
    <section id="hero" className="hero">
      <Container className="hero-grid">
        <div className="hero-copy">
          <span className="badge badge-brand">{h.badge}</span>
          <h1 className="hero-title font-display">{h.title}</h1>
          <p className="hero-subtitle">{h.subtitle}</p>

          <div className="hero-actions">
            <Button
              as={Link}
              to={isAuthenticated ? '/app' : '/register'}
              variant="primary"
              size="lg"
              icon={<ArrowIcon />}
            >
              {isAuthenticated ? 'Open Workspace' : h.ctaPrimary}
            </Button>
            <Button as="a" href="#how-it-works" variant="outline" size="lg" icon={<PlayIcon width={16} height={16} />}>
              {h.ctaSecondary}
            </Button>
          </div>
          <p className="hero-note">{h.noCard}</p>
        </div>

        <div className="hero-visual">
          <div className="hero-glow" aria-hidden="true" />
          <div className="card hero-card">
            <div className="hero-card-head">
              <span className="hero-card-title font-display">{h.cardTitle}</span>
              <span className="badge badge-brand">{h.cardTag}</span>
            </div>

            <ul className="hero-card-list">
              {appointments.map((apt) => (
                <li key={apt.name} className={`hero-apt hero-apt-${apt.tone}`}>
                  <span className="hero-apt-avatar font-display">{apt.name.charAt(0)}</span>
                  <span className="hero-apt-meta">
                    <span className="hero-apt-name">{apt.name}</span>
                    <span className="hero-apt-sub">{apt.meta}</span>
                  </span>
                  <StatusBadge status={apt.status} tone={apt.tone} />
                </li>
              ))}
            </ul>

            <div className="hero-card-stat">
              <span className="hero-card-stat-value font-display">32</span>
              <span className="hero-card-stat-meta">
                <span>{h.statLabel}</span>
                <span className="hero-card-stat-delta">{h.statDelta}</span>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
