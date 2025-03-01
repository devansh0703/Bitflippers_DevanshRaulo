import tt from '@tomtom-international/web-sdk-maps';

export function initializeMap(container: string, center: [number, number]) {
  // Make sure the element exists before initializing
  const element = document.getElementById(container);
  if (!element) {
    throw new Error(`Map container element with id '${container}' not found`);
  }

  const map = tt.map({
    key: import.meta.env.VITE_TOMTOM_API_KEY || "default_key",
    container,
    center,
    zoom: 13
  });

  return map;
}

export async function getCurrentLocation(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.longitude, position.coords.latitude]);
      },
      (error) => {
        reject(error);
      }
    );
  });
}