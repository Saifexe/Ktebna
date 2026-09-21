// Google Maps config. The key is a browser key, restrict it by HTTP referrer
// in Google Cloud Console; without it every map component renders nothing.
export const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// Advanced markers need a map ID; Google's DEMO_MAP_ID works for development.
export const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

export const TUNISIA_CENTER = { lat: 34.3, lng: 9.6 };

// Approximate centre of each governorate seat, keyed like data/cities.js.
const CITY_COORDS = {
  Tunis: { lat: 36.8065, lng: 10.1815 },
  Ariana: { lat: 36.8625, lng: 10.1956 },
  Manouba: { lat: 36.8101, lng: 10.0956 },
  "Ben Arous": { lat: 36.7531, lng: 10.2189 },
  Nabeul: { lat: 36.4513, lng: 10.7357 },
  Bizerte: { lat: 37.2744, lng: 9.8739 },
  Zaghouan: { lat: 36.4029, lng: 10.1429 },
  Sousse: { lat: 35.8256, lng: 10.636 },
  Monastir: { lat: 35.7643, lng: 10.8113 },
  Mahdia: { lat: 35.5047, lng: 11.0622 },
  Sfax: { lat: 34.7406, lng: 10.7603 },
  Béja: { lat: 36.7256, lng: 9.1817 },
  Jendouba: { lat: 36.5011, lng: 8.7802 },
  "Le Kef": { lat: 36.1826, lng: 8.7149 },
  Siliana: { lat: 36.0849, lng: 9.3708 },
  Kairouan: { lat: 35.6781, lng: 10.0963 },
  "Sidi Bouzid": { lat: 35.0382, lng: 9.4849 },
  Kasserine: { lat: 35.1676, lng: 8.8365 },
  Gabès: { lat: 33.8815, lng: 10.0982 },
  Médenine: { lat: 33.3549, lng: 10.5055 },
  Gafsa: { lat: 34.425, lng: 8.7842 },
  Tozeur: { lat: 33.9197, lng: 8.1335 },
  Tataouine: { lat: 32.9297, lng: 10.4518 },
  Kébili: { lat: 33.7044, lng: 8.969 },
};

export const cityCenter = (city) => CITY_COORDS[city] || null;

export const hasPin = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng);

// Works with or without an API key, so the link is always offered.
export const googleMapsLink = ({ lat, lng, spot, city }) => {
  const query = hasPin(lat, lng) ? `${lat},${lng}` : [spot, city, "Tunisia"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
