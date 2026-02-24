import { Hero } from './_components/hero';
import { Features } from './_components/features';
import { Pricing } from './_components/pricing';
import { Testimonials } from './_components/testimonials';
import { CTA } from './_components/cta';

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <CTA />
    </>
  );
}
