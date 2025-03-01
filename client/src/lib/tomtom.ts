
import tt from '@tomtom-international/web-sdk-maps';

export function initializeMap(container: string, center: [number, number]) {
  // Make sure the element exists before initializing
  const element = document.getElementById(container);
  if (!element) {
    console.error(`Map container element with id '${container}' not found`);
    throw new Error(`Map container element with id '${container}' not found`);
  }

  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey || apiKey === 'default_key') {
    console.warn('TomTom API key is not set or is using the default value. Map functionality may be limited.');
  }

  try {
    const map = tt.map({
      key: apiKey || "default_key",
      container,
      center,
      zoom: 13,
      stylesVisibility: {
        map: true,
        poi: true,
        trafficFlow: true,
        trafficIncidents: true
      }
    });

    return map;
  } catch (error) {
    console.error('Failed to initialize TomTom map:', error);
    throw error;
  }
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
        console.error('Error getting current location:', error);
        // Default to New York coordinates if geolocation fails
        resolve([-73.935242, 40.730610]);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}
