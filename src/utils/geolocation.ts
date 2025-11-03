import geoip from 'geoip-lite';

export interface GeoLocation {
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  ll: [number, number] | null;
}

export const getLocationFromIp = (ip: string): GeoLocation => {
  try {
    const geo = geoip.lookup(ip);
    
    if (!geo) {
      return {
        country: null,
        city: null,
        region: null,
        timezone: null,
        ll: null
      };
    }
    
    return {
      country: geo.country || null,
      city: geo.city || null,
      region: geo.region || null,
      timezone: geo.timezone || null,
      ll: geo.ll || null
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return {
      country: null,
      city: null,
      region: null,
      timezone: null,
      ll: null
    };
  }
};

export const detectSuspiciousLogin = (currentLocation: GeoLocation, previousLocation: GeoLocation | null): boolean => {
  if (!previousLocation || !currentLocation.ll || !previousLocation.ll) {
    return false;
  }
  
  const [lat1, lon1] = currentLocation.ll;
  const [lat2, lon2] = previousLocation.ll;
  
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Flag if login is from > 1000km away and different country
  return distance > 1000 && currentLocation.country !== previousLocation.country;
};
