import { useLanguage } from '../i18n/LanguageContext';
import Container from './Container';
import {
  CalendarIcon,
  UsersIcon,
  StethoscopeIcon,
  InvoiceIcon,
  ChartIcon,
  ShieldIcon,
} from './icons';

const ICONS = {
  calendar: CalendarIcon,
  users: UsersIcon,
  stethoscope: StethoscopeIcon,
  invoice: InvoiceIcon,
  chart: ChartIcon,
  shield: ShieldIcon,
};

function FeatureCard({ icon, title, desc }) {
  const Icon = ICONS[icon];
  return (
    <div className="card feature-card">
      <div className="feature-icon">
        <Icon width={20} height={20} />
      </div>
      <h3 className="feature-title font-display">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}

export default function Features() {
  const { t } = useLanguage();
  const f = t.features;

  return (
    <section id="features" className="features">
      <Container>
        <div className="section-head">
          <span className="eyebrow">{f.eyebrow}</span>
          <h2 className="section-title font-display">{f.title}</h2>
          <p className="section-subtitle">{f.subtitle}</p>
        </div>

        <div className="features-grid">
          {f.items.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
