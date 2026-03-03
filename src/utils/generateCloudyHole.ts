export function generateCloudyHole(
    centerLat: number,
    centerLng: number,
    baseRadiusDeg: number,
    numPoints: number = 40
): { latitude: number; longitude: number }[] {
    const points = [];

    for (let i = 0; i < numPoints; i++) {
        const theta = (Math.PI * 2 * (numPoints - i)) / numPoints; // Go backwards for CCW

        const aspect = Math.cos(centerLat * (Math.PI / 180));

        const lat = centerLat + baseRadiusDeg * Math.sin(theta);
        const lng = centerLng + (baseRadiusDeg * Math.cos(theta)) / aspect;

        points.push({ latitude: lat, longitude: lng });
    }

    return points;
}
