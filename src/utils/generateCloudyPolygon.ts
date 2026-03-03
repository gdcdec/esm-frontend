import { GeoCoordinate } from './fetchCityBoundary';

/**
 * 
 * @param baseBoundary The coordinates making up the city polygon hole.
 * @param phase The current animation timeframe.
 * @param noiseIntensity A multiplier for how "fluffy" or deep the clouds are (in degrees coords).
 */
export function generateCloudyPolygon(
    baseBoundary: GeoCoordinate[],
    phase: number,
    noiseIntensity: number = 0.02
): GeoCoordinate[] {
    if (!baseBoundary || baseBoundary.length < 3) return baseBoundary;

    const points = [];
    const numPoints = baseBoundary.length;

    for (let i = 0; i < numPoints; i++) {
        const pt = baseBoundary[i];

        // Progress around the perimeter (0 to 2PI roughly) to feed into the sine functions
        const theta = (Math.PI * 2 * i) / numPoints;

        // Multiple overlapping sine waves for irregular "fluffy" noise
        const noisePrimary = Math.sin(theta * 8 + phase) * 0.5;
        const noiseSecondary = Math.cos(theta * 5 - phase * 1.5) * 0.3;
        const noiseTertiary = Math.sin(theta * 12 + phase * 0.5) * 0.2;

        const totalNoiseShift = (noisePrimary + noiseSecondary + noiseTertiary) * noiseIntensity;

        const aspect = Math.cos(pt.latitude * (Math.PI / 180));

        const lat = pt.latitude + totalNoiseShift * Math.sin(theta);
        const lng = pt.longitude + (totalNoiseShift * Math.cos(theta)) / aspect;

        points.push({ latitude: lat, longitude: lng });
    }

    return points;
}
