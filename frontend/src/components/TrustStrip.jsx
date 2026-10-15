import { useLanguage } from '../i18n/LanguageContext';
import Container from './Container';

export default function TrustStrip() {
  const { t } = useLanguage();

  return (
    <section className="trust-strip">
      <Container>
        <p className="trust-label">{t.trust.label}</p>
        <div className="trust-stats">
          {t.trust.stats.map((stat) => (
            <div className="trust-stat" key={stat.label}>
              <span className="trust-stat-value font-display">{stat.value}</span>
              <span className="trust-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
