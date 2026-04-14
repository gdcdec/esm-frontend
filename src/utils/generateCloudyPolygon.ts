import { GeoCoordinate } from './fetchCityBoundary';

/**
 * Алгоритм сглаживания полигона Chaikin'a
 * Преобразует угловатую границу города в плавную кривую
 * 
 * @param baseBoundary Исходные координаты полигона города
 * @param iterations Количество проходов сглаживания (по умолчанию 4)
 */
export function generateCloudyPolygon(
    baseBoundary: GeoCoordinate[],
    iterations: number = 4
): GeoCoordinate[] {
    if (!baseBoundary || baseBoundary.length < 3) return baseBoundary;

    let result = baseBoundary;

    // Алгоритм Chaikin'a: каждый отрезок A->B заменяется двумя точками на 25% и 75%
    // Повторение сглаживает все углы
    for (let iter = 0; iter < iterations; iter++) {
        const smoothed: GeoCoordinate[] = [];
        const len = result.length;

        for (let i = 0; i < len; i++) {
            const p1 = result[i];
            const p2 = result[(i + 1) % len];

            // Точка на 25% от p1 к p2
            smoothed.push({
                latitude: p1.latitude * 0.75 + p2.latitude * 0.25,
                longitude: p1.longitude * 0.75 + p2.longitude * 0.25,
            });
            // Точка на 75% от p1 к p2
            smoothed.push({
                latitude: p1.latitude * 0.25 + p2.latitude * 0.75,
                longitude: p1.longitude * 0.25 + p2.longitude * 0.75,
            });
        }
        result = smoothed;
    }

    return result;
}
