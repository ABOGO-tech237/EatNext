import { HomeCuisines } from '../components/home/HomeCuisines';
import { HomeHero } from '../components/home/HomeHero';
import { HomeOwnerCta } from '../components/home/HomeOwnerCta';
import { HomeRails } from '../components/home/HomeRails';

/**
 * Accueil diner — recherche, collections, puis restaurateurs.
 */
export default function HomePage() {
  return (
    <div>
      <HomeHero />
      <HomeCuisines />
      <HomeRails />
      <HomeOwnerCta />
    </div>
  );
}
