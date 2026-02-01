// OSRM (Open Source Routing Machine) - Free routing service
// Uses OpenStreetMap data, no API key required

export interface RouteResult {
  distance: number; // in kilometers
  duration: number; // in hours
  geometry?: string; // encoded polyline
}

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
}

interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    distance: number; // meters
    duration: number; // seconds
    geometry: string;
  }>;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Geocode an address to coordinates using Nominatim
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'ru',
          'User-Agent': 'LogisticsApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const results: NominatimResult[] = await response.json();
    
    if (results.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(results[0].lat),
      lon: parseFloat(results[0].lon),
      displayName: results[0].display_name
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Calculate route between two points using OSRM
 */
export const calculateRoute = async (
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<RouteResult | null> => {
  try {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=polyline`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Routing failed');
    }

    const data: OSRMRouteResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];

    return {
      distance: route.distance / 1000, // Convert to km
      duration: route.duration / 3600, // Convert to hours
      geometry: route.geometry
    };
  } catch (error) {
    console.error('Routing error:', error);
    return null;
  }
};

/**
 * Calculate route between two addresses
 */
export const calculateRouteBetweenAddresses = async (
  fromAddress: string,
  toAddress: string
): Promise<RouteResult | null> => {
  try {
    // Geocode both addresses
    const [fromGeo, toGeo] = await Promise.all([
      geocodeAddress(fromAddress),
      geocodeAddress(toAddress)
    ]);

    if (!fromGeo || !toGeo) {
      console.error('Could not geocode one or both addresses');
      return null;
    }

    // Calculate route
    return await calculateRoute(fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon);
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
};

/**
 * Calculate fuel consumption based on distance and vehicle consumption rate
 */
export const calculateFuelConsumption = (
  distanceKm: number,
  consumptionPer100Km: number = 30 // Default 30L/100km for trucks
): number => {
  return (distanceKm / 100) * consumptionPer100Km;
};

/**
 * Estimate fuel cost
 */
export const estimateFuelCost = (
  distanceKm: number,
  consumptionPer100Km: number = 30,
  fuelPricePerLiter: number = 55 // Default diesel price in RUB
): number => {
  const fuelNeeded = calculateFuelConsumption(distanceKm, consumptionPer100Km);
  return fuelNeeded * fuelPricePerLiter;
};
