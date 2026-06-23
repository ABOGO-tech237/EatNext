import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Layout global : Header sticky + contenu + Footer.
 * Pas de transition de route ici — remonter <Outlet /> à chaque navigation
 * casse les cartes Leaflet, les formulaires et provoque des flashs visuels.
 */
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
