import { useLanguage } from '../i18n/LanguageContext';
import Container from './Container';

export default function HowItWorks() {
  const { t } = useLanguage();
  const h = t.how;

  return (
    <section id="how-it-works" className="how">
      <Container>
        <div className="section-head">
          <span className="eyebrow">{h.eyebrow}</span>
          <h2 className="section-title font-display">{h.title}</h2>
          <p className="section-subtitle">{h.subtitle}</p>
        </div>

        <ol className="how-steps">
          {h.steps.map((step, i) => (
            <li className="how-step" key={step.title}>
              <span className="how-step-index font-display">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="how-step-title font-display">{step.title}</h3>
              <p className="how-step-desc">{step.desc}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
