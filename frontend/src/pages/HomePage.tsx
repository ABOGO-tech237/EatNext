import { HomeCuisines } from '../components/home/HomeCuisines';
import { HomeFeatured } from '../components/home/HomeFeatured';
import { HomeHero } from '../components/home/HomeHero';
import { HomeOwnerCta } from '../components/home/HomeOwnerCta';
import { HomeRails } from '../components/home/HomeRails';
import { HomeSteps } from '../components/home/HomeSteps';

/**
 * Accueil diner — photo, collections, motion au scroll.
 */
export default function HomePage() {
  return (
    <div>
      <HomeHero />
      <HomeCuisines />
      <HomeRails />
      <HomeFeatured />
      <HomeSteps />
      <HomeOwnerCta />
    </div>
  );
}
