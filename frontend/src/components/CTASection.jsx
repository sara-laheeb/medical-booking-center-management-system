import { useLanguage } from '../i18n/LanguageContext';
import Container from './Container';
import Button from './Button';
import { ArrowIcon } from './icons';

export default function CTASection() {
  const { t } = useLanguage();
  const c = t.cta;

  return (
    <section id="get-started" className="cta-section">
      <Container>
        <div className="cta-banner">
          <div>
            <h2 className="cta-title font-display">{c.title}</h2>
            <p className="cta-subtitle">{c.subtitle}</p>
          </div>
          <div className="cta-actions">
            <Button as="a" href="#get-started" variant="primary" size="lg" icon={<ArrowIcon />}>
              {c.ctaPrimary}
            </Button>
            <Button as="a" href="#signin" variant="ghost" size="lg" className="cta-ghost">
              {c.ctaSecondary}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
