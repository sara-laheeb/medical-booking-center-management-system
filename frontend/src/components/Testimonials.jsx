import { useLanguage } from '../i18n/LanguageContext';
import Container from './Container';
import { StarIcon } from './icons';

export default function Testimonials() {
  const { t } = useLanguage();
  const s = t.testimonials;

  return (
    <section id="testimonials" className="testimonials">
      <Container>
        <div className="section-head">
          <span className="eyebrow">{s.eyebrow}</span>
          <h2 className="section-title font-display">{s.title}</h2>
        </div>

        <div className="testimonials-grid">
          {s.items.map((item) => (
            <div className="card testimonial-card" key={item.name}>
              <div className="testimonial-stars" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} width={14} height={14} />
                ))}
              </div>
              <p className="testimonial-quote">“{item.quote}”</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar font-display">{item.name.charAt(0)}</span>
                <span>
                  <span className="testimonial-name">{item.name}</span>
                  <span className="testimonial-role">{item.role}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
