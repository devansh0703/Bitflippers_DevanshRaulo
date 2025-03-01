
// Use the globally loaded TomTom script
declare global {
  interface Window {
    tt: any;
  }
}

// Hardcoded API key for simplicity
const API_KEY = '77JkMkCLVXYqkGQ1TKnYHtjMDX0gkz2p';

export function initializeMap(container: string, center: [number, number]) {
  // Make sure the element exists before initializing
  const element = document.getElementById(container);
  if (!element) {
    console.error(`Map container element with id '${container}' not found`);
    throw new Error(`Map container element with id '${container}' not found`);
  }

  try {
    if (!window.tt) {
      console.error('TomTom library not loaded. Make sure the script is included in your HTML.');
      throw new Error('TomTom library not loaded');
    }

    const map = window.tt.map({
      key: API_KEY,
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

    console.log('Map initialization successful with API key');
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

// Calculate route between two points using TomTom API
export async function calculateRoute(
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number
) {
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLng}:${endLat},${endLng}/json?key=${API_KEY}&traffic=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}
