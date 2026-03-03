export interface GeoCoordinate {
    latitude: number;
    longitude: number;
}

export interface CityBoundaryData {
    coords: GeoCoordinate[];
    center: GeoCoordinate;
}

export function calculateCentroid(coords: GeoCoordinate[]): GeoCoordinate {
    if (!coords || coords.length === 0) return { latitude: 0, longitude: 0 };

    let signedArea = 0;
    let cx = 0;
    let cy = 0;

    // We assume coords is a closed polygon (first == last point).
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        // Using lng as x and lat as y
        const a = (p0.longitude * p1.latitude) - (p1.longitude * p0.latitude);
        signedArea += a;
        cx += (p0.longitude + p1.longitude) * a;
        cy += (p0.latitude + p1.latitude) * a;
    }

    // If signedArea is 0 (e.g. invalid polygon), fallback to average
    if (signedArea === 0) {
        if (coords.length === 0) return { latitude: 0, longitude: 0 };
        const avgLat = coords.reduce((sum, c) => sum + c.latitude, 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c.longitude, 0) / coords.length;
        return { latitude: avgLat, longitude: avgLng };
    }

    signedArea *= 0.5;
    cx = cx / (6.0 * signedArea);
    cy = cy / (6.0 * signedArea);

    return { latitude: cy, longitude: cx };
}

export async function fetchCityBoundary(cityName: string, maxPoints: number = 200): Promise<CityBoundaryData | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&polygon_geojson=1&format=json`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'MoyDonos-App/1.0',
            }
        });

        if (!response.ok) {
            console.warn(`[Nominatim] Fetch failed with status ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            console.warn(`[Nominatim] No results found for region: ${cityName}`);
            return null;
        }

        // Find the most relevant administrative boundary (usually the first result with a polygon)
        const bestResult = data.find((row: any) => row.geojson && (row.geojson.type === 'Polygon' || row.geojson.type === 'MultiPolygon'));

        if (!bestResult) {
            console.warn(`[Nominatim] No GeoJSON polygon found for region: ${cityName}`);
            return null;
        }

        let rawCoords: number[][] = [];

        if (bestResult.geojson.type === 'Polygon') {
            // Polygon structure: [[[lng, lat], [lng, lat], ...]]]
            rawCoords = bestResult.geojson.coordinates[0];
        } else if (bestResult.geojson.type === 'MultiPolygon') {
            // MultiPolygon structure: [[[[lng, lat], ...]], [[[lng, lat], ...]]]
            // We'll just take the first/largest polygon from the multipolygon set for the hole
            rawCoords = bestResult.geojson.coordinates[0][0];
        }

        // Convert [longitude, latitude] to {latitude, longitude}
        let mappedCoords: GeoCoordinate[] = rawCoords.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0]
        }));

        // Decimate (simplify) the polygon to reduce rendering load
        if (mappedCoords.length > maxPoints) {
            const step = Math.ceil(mappedCoords.length / maxPoints);
            const decimated = [];
            for (let i = 0; i < mappedCoords.length; i += step) {
                decimated.push(mappedCoords[i]);
            }
            // Ensure polygon is closed
            if (decimated.length > 0) {
                decimated.push(decimated[0]);
            }
            mappedCoords = decimated;
        }

        return {
            coords: mappedCoords.reverse(),
            center: {
                latitude: parseFloat(bestResult.lat),
                longitude: parseFloat(bestResult.lon)
            }
        };

    } catch (error) {
        console.error(`[Nominatim] Error fetching boundary for ${cityName}:`, error);
        return null;
    }
}
