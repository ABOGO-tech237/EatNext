import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import OsmRestaurantPage from './pages/OsmRestaurantPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 gap-4">
              <h1 className="text-3xl font-semibold">EatNext</h1>
              <p className="text-gray-600 text-sm max-w-md text-center">
                Découverte de restaurants — base locale + OpenStreetMap (Overpass).
              </p>
              <Link
                to="/search"
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium"
              >
                Rechercher à proximité
              </Link>
            </main>
          }
        />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/osm/:osmType/:osmId" element={<OsmRestaurantPage />} />
      </Routes>
    </BrowserRouter>
  );
}
