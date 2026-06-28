export interface Coords {
  lat: number;
  lon: number;
}

export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function haversineMi(a: Coords, b: Coords): number {
  return haversineKm(a, b) * 0.621371;
}

export function geographicMidpoint(a: Coords, b: Coords): Coords {
  return { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
}

// Approximates a "fair" midpoint by biasing toward whoever has a higher urban
// density (proxied by latitude in the US — higher lat ≈ denser NE corridors).
// Without a routing API this is a heuristic: it gives a visually distinct point
// and correct directional intuition for most US city pairs.
export function fairMidpoint(a: Coords, b: Coords): Coords {
  const km = haversineKm(a, b);
  if (km < 2) return geographicMidpoint(a, b);

  const urbanFactor = (lat: number) => 1 / (1 + Math.exp(-(lat - 38) * 0.35));
  // Higher urban factor → slower avg speed → person needs a closer midpoint
  const speedA = 65 * (1 - urbanFactor(a.lat) * 0.28);
  const speedB = 65 * (1 - urbanFactor(b.lat) * 0.28);
  // Place midpoint at the fraction t where timeA ≈ timeB: t/speedA = (1-t)/speedB
  const t = speedA / (speedA + speedB);

  return {
    lat: a.lat + t * (b.lat - a.lat),
    lon: a.lon + t * (b.lon - a.lon),
  };
}

export function estimateDriveMinutes(from: Coords, to: Coords): number {
  const km = haversineKm(from, to);
  // Road distance is typically 1.2–1.5× the straight-line distance.
  // Short urban trips have more turns; long trips are more highway-direct.
  const roadFactor = km < 50 ? 1.5 : km < 150 ? 1.35 : 1.2;
  const avgSpeedKph = 60;
  return Math.max(1, Math.round((km * roadFactor) / avgSpeedKph * 60));
}
