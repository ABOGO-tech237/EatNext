import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

/**
 * Layout global de l'application : Header sticky + zone de contenu + Footer.
 * Utilisé comme route parente dans App.tsx ; les pages enfants s'affichent via <Outlet />.
 * min-h-screen + flex-col garantit que le footer reste en bas même sur les pages courtes.
 */
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Header />
      <main className="page-enter flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
