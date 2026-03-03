export function generateCloudyHole(
    centerLat: number,
    centerLng: number,
    baseRadiusDeg: number,
    phase: number,
    numPoints: number = 40
): { latitude: number; longitude: number }[] {
    const points = [];

    for (let i = 0; i < numPoints; i++) {
        const theta = (Math.PI * 2 * (numPoints - i)) / numPoints; // Go backwards for CCW

        const noisePrimary = Math.sin(theta * 6 + phase) * 0.15;
        const noiseSecondary = Math.cos(theta * 4 - phase * 1.5) * 0.1;
        const noiseTertiary = Math.sin(theta * 9 + phase * 0.5) * 0.05;

        // Radius at this specific angle
        const currentRadius = baseRadiusDeg * (1 + noisePrimary + noiseSecondary + noiseTertiary);

        const aspect = Math.cos(centerLat * (Math.PI / 180));

        const lat = centerLat + currentRadius * Math.sin(theta);
        const lng = centerLng + (currentRadius * Math.cos(theta)) / aspect;

        points.push({ latitude: lat, longitude: lng });
    }

    return points;
}
