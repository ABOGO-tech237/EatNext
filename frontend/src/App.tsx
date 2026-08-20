import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ProLayout } from './components/layout/ProLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OwnerRoute } from './components/auth/OwnerRoute';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import OsmRestaurantPage from './pages/OsmRestaurantPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CguPage from './pages/CguPage';
import ProDashboardPage from './pages/pro/ProDashboardPage';
import ProOnboardingPage from './pages/pro/ProOnboardingPage';
import ProRestaurantNewPage from './pages/pro/ProRestaurantNewPage';
import ProRestaurantEditPage from './pages/pro/ProRestaurantEditPage';
import ProRestaurantMenuPage from './pages/pro/ProRestaurantMenuPage';
import ProRestaurantReviewsPage from './pages/pro/ProRestaurantReviewsPage';

/**
 * Deux espaces, une app : diner (`/`) et console restaurateur (`/pro`).
 * Pas d'AnimatePresence autour de <Outlet /> — évite pages blanches / remount Leaflet.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="osm/:osmType/:osmId" element={<OsmRestaurantPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="a-propos" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="cgu" element={<CguPage />} />
          <Route
            path="favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/pro"
          element={
            <OwnerRoute>
              <ProLayout />
            </OwnerRoute>
          }
        >
          <Route index element={<ProDashboardPage />} />
          <Route path="onboarding" element={<ProOnboardingPage />} />
          <Route path="restaurants/new" element={<ProRestaurantNewPage />} />
          <Route path="restaurants/:id" element={<ProRestaurantEditPage />} />
          <Route path="restaurants/:id/menu" element={<ProRestaurantMenuPage />} />
          <Route path="restaurants/:id/reviews" element={<ProRestaurantReviewsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
