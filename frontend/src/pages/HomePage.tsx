import { HomeCuisines } from '../components/home/HomeCuisines';
import { HomeFeatured } from '../components/home/HomeFeatured';
import { HomeHero } from '../components/home/HomeHero';
import { HomeMoments } from '../components/home/HomeMoments';
import { HomeOwnerCta } from '../components/home/HomeOwnerCta';
import { HomeSteps } from '../components/home/HomeSteps';

/**
 * Accueil diner — densité visuelle, collections, puis restaurateurs.
 */
export default function HomePage() {
  return (
    <div>
      <HomeHero />
      <HomeCuisines />
      <HomeFeatured />
      <HomeMoments />
      <HomeSteps />
      <HomeOwnerCta />
    </div>
  );
}
