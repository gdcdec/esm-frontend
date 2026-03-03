import { GeoCoordinate } from './fetchCityBoundary';

/**
 * Chaikin's Corner-Cutting Algorithm to smooth out a jagged polygon.
 * This takes the raw city boundary (which can be blocky, especially after decimation)
 * and turns it into a perfectly smooth, flowing continuous curve.
 * 
 * @param baseBoundary The raw coordinates making up the city polygon hole.
 * @param iterations The number of smoothing passes (default 4 is very smooth).
 */
export function generateCloudyPolygon(
    baseBoundary: GeoCoordinate[],
    iterations: number = 4
): GeoCoordinate[] {
    if (!baseBoundary || baseBoundary.length < 3) return baseBoundary;

    let result = baseBoundary;

    // Chaikin's algorithm: for every line segment A->B, replace it with two points
    // at 25% and 75% along the segment. Repeating this physically rounds off all corners.
    for (let iter = 0; iter < iterations; iter++) {
        const smoothed: GeoCoordinate[] = [];
        const len = result.length;

        for (let i = 0; i < len; i++) {
            const p1 = result[i];
            const p2 = result[(i + 1) % len];

            // Point at 25% distance from p1 to p2
            smoothed.push({
                latitude: p1.latitude * 0.75 + p2.latitude * 0.25,
                longitude: p1.longitude * 0.75 + p2.longitude * 0.25,
            });
            // Point at 75% distance from p1 to p2
            smoothed.push({
                latitude: p1.latitude * 0.25 + p2.latitude * 0.75,
                longitude: p1.longitude * 0.25 + p2.longitude * 0.75,
            });
        }
        result = smoothed;
    }

    return result;
}
