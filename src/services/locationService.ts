export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  city?: string;
  district?: string;
  state?: string;
}

// Center point: Sivakasi, Tamil Nadu, India
export const SIVAKASI_COORDINATES: GeoCoordinates = {
  latitude: 9.4533,
  longitude: 77.7979,
  city: 'Sivakasi',
  district: 'Virudhunagar',
  state: 'Tamil Nadu',
};

export const POPULAR_DISTRICTS = [
  { city: 'Sivakasi', district: 'Virudhunagar', pincode: '626123', lat: 9.4533, lon: 77.7979 },
  { city: 'Virudhunagar', district: 'Virudhunagar', pincode: '626001', lat: 9.568, lon: 77.9624 },
  { city: 'Rajapalayam', district: 'Virudhunagar', pincode: '626117', lat: 9.4532, lon: 77.5537 },
  { city: 'Sattur', district: 'Virudhunagar', pincode: '626203', lat: 9.3591, lon: 77.9258 },
  { city: 'Madurai', district: 'Madurai', pincode: '625001', lat: 9.9252, lon: 78.1198 },
  { city: 'Tirunelveli', district: 'Tirunelveli', pincode: '627001', lat: 8.7139, lon: 77.7567 },
  { city: 'Coimbatore', district: 'Coimbatore', pincode: '641001', lat: 11.0168, lon: 76.9558 },
  { city: 'Chennai', district: 'Chennai', pincode: '600001', lat: 13.0827, lon: 80.2707 },
];

/**
 * Requests device geolocation through the browser navigator.
 * Falls back to Sivakasi coordinates if user denies or in unsupported iframe.
 */
export async function detectDeviceLocation(): Promise<{
  coords: GeoCoordinates;
  granted: boolean;
  message: string;
}> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      coords: SIVAKASI_COORDINATES,
      granted: false,
      message: 'Geolocation is not supported by your browser. Using approximate location.',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: Number(position.coords.latitude.toFixed(4)),
            longitude: Number(position.coords.longitude.toFixed(4)),
            accuracyMeters: Math.round(position.coords.accuracy),
            city: 'Sivakasi',
            district: 'Virudhunagar',
            state: 'Tamil Nadu',
          },
          granted: true,
          message: 'Location detected successfully.',
        });
      },
      (error) => {
        let msg = 'Location permission is optional. You can manually select your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Using manual location selection.';
        }
        resolve({
          coords: SIVAKASI_COORDINATES,
          granted: false,
          message: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000,
      }
    );
  });
}
