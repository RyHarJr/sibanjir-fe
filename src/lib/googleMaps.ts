/**
 * googleMaps.ts
 * Reliable Google Maps JS API loader using @googlemaps/js-api-loader v2.
 *
 * setOptions() triggers script injection (async). We wait for the bootstrap
 * by polling `google.maps.importLibrary` availability before calling it.
 */
import { setOptions } from "@googlemaps/js-api-loader";

let loadPromise: Promise<void> | null = null;

/**
 * Ensure the Google Maps JS script is injected and bootstrapped.
 * Returns a promise that resolves once `google.maps.importLibrary` is ready.
 */
function ensureLoaded(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Configure and inject the <script> tag
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: "weekly",
      libraries: ["places", "geometry", "marker"],
      language: "id",
      region: "ID",
    });

    // Poll until google.maps.importLibrary is available (script bootstrapped)
    const maxWait = 10_000; // 10s timeout
    const interval = 50;
    let elapsed = 0;

    const poll = setInterval(() => {
      if (typeof window !== "undefined" && window.google?.maps?.importLibrary) {
        clearInterval(poll);
        resolve();
        return;
      }
      elapsed += interval;
      if (elapsed >= maxWait) {
        clearInterval(poll);
        reject(new Error("Google Maps failed to load within timeout"));
      }
    }, interval);
  });

  return loadPromise;
}

/** Load all map libraries needed by any component. */
export async function loadGoogleMaps() {
  await ensureLoaded();

  const [mapsLib, placesLib, markerLib] = await Promise.all([
    google.maps.importLibrary("maps"),
    google.maps.importLibrary("places"),
    google.maps.importLibrary("marker"),
  ]);

  return {
    mapsLib:   mapsLib   as google.maps.MapsLibrary,
    placesLib: placesLib as google.maps.PlacesLibrary,
    markerLib: markerLib as google.maps.MarkerLibrary,
  };
}

/** Preload the Maps SDK without waiting — call on page mount for faster UX. */
export function preloadGoogleMaps() {
  ensureLoaded().catch(() => {});
}
