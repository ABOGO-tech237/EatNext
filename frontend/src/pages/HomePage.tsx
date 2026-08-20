import { HomeCuisines } from '../components/home/HomeCuisines';
import { HomeFeatured } from '../components/home/HomeFeatured';
import { HomeHero } from '../components/home/HomeHero';
import { HomeRails } from '../components/home/HomeRails';
import { HomeSteps } from '../components/home/HomeSteps';

/**
 * Accueil diner — intention, photos, collections, mieux notés.
 */
export default function HomePage() {
  return (
    <div>
      <HomeHero />
      <HomeCuisines />
      <HomeRails />
      <HomeFeatured />
      <HomeSteps />
    </div>
  );
}
