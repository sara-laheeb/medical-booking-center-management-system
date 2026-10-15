import { useLanguage } from '../i18n/LanguageContext';
import Container from './Container';
import { MedicalCrossIcon } from './icons';

export default function Footer() {
  const { t } = useLanguage();
  const f = t.footer;
  const year = new Date().getFullYear();

  const columns = [
    { title: f.product, links: [f.features, f.pricing, f.security] },
    { title: f.company, links: [f.about, f.careers, f.contact] },
    { title: f.resources, links: [f.help, f.docs, f.status] },
  ];

  return (
    <footer className="footer">
      <Container className="footer-grid">
        <div className="footer-brand">
          <a href="#hero" className="brand">
            <span className="brand-mark">
              <MedicalCrossIcon />
            </span>
            <span className="brand-text">
              <span className="brand-name font-display">{t.brandName}</span>
            </span>
          </a>
          <p className="footer-tagline">{f.tagline}</p>
        </div>

        {columns.map((col) => (
          <div className="footer-col" key={col.title}>
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#hero">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <Container className="footer-bottom">
        <span>
          © {year} {t.brandName}. {f.rights}
        </span>
      </Container>
    </footer>
  );
}
