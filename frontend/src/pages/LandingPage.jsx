/**
 * Public Landing Page
 * Marketing-facing entry point with navbar, hero section, trust strip,
 * feature highlights, how-it-works walkthrough, testimonials, CTA, and footer.
 */

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TrustStrip from '../components/TrustStrip';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>

      <Footer />
    </>
  );
}