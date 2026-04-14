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

    // Предполагаем, что координаты образуют замкнутый полигон
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        // Используем долготу как X и широту как Y
        const a = (p0.longitude * p1.latitude) - (p1.longitude * p0.latitude);
        signedArea += a;
        cx += (p0.longitude + p1.longitude) * a;
        cy += (p0.latitude + p1.latitude) * a;
    }

    // При нулевой площади (некорректный полигон) используем усреднение
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

export function isPointInPolygon(point: GeoCoordinate, polygon: GeoCoordinate[]): boolean {
    if (!polygon || polygon.length < 3) return false;
    
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude;
        const yi = polygon[i].latitude;
        const xj = polygon[j].longitude;
        const yj = polygon[j].latitude;
        
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

export async function fetchCityBoundary(cityName: string, maxPoints: number = 200): Promise<CityBoundaryData | null> {
    try {
        let url: string;
        let headers: Record<string, string> = {
            'User-Agent': 'MoyDonos-App/1.0',
        };

        url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&country=RU&polygon_geojson=1&format=json`;
        
        try {
            const response = await fetch(url, { headers });

            if (!response.ok) {
                console.warn(`[Nominatim] Fetch failed with status ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                console.warn(`[Nominatim] No results found for region: ${cityName}`);
                return null;
            }

            // Приоритет: 1) city/administrative, 2) city, 3) любой с полигоном
            let bestResult = data.find((row: any) => 
                row.geojson && 
                (row.type === 'city' || row.type === 'administrative') &&
                (row.geojson.type === 'Polygon' || row.geojson.type === 'MultiPolygon')
            );

            // Запасной вариант - любой результат с полигоном
            if (!bestResult) {
                bestResult = data.find((row: any) => 
                    row.geojson && 
                    (row.geojson.type === 'Polygon' || row.geojson.type === 'MultiPolygon')
                );
            }

            if (!bestResult) {
                console.warn(`[Nominatim] No GeoJSON polygon found for region: ${cityName}`);
                return null;
            }

            let rawCoords: number[][] = [];

            if (bestResult.geojson.type === 'Polygon') {
                // Структура Polygon: [[[lng, lat], [lng, lat], ...]]]
                rawCoords = bestResult.geojson.coordinates[0];
            } else if (bestResult.geojson.type === 'MultiPolygon') {
                // Структура MultiPolygon: [[[[lng, lat], ...]], [[[lng, lat], ...]]]
                // Объединяем все полигоны, выбирая наибольший
                let largestPolygon: number[][] = [];
                let maxArea = 0;
                
                for (const polygon of bestResult.geojson.coordinates) {
                    const coords = polygon[0]; // Первый контур каждого многоугольника
                    // Простое вычисление площади для сравнения
                    let area = 0;
                    for (let i = 0; i < coords.length - 1; i++) {
                        area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
                    }
                    area = Math.abs(area) / 2;
                    
                    if (area > maxArea) {
                        maxArea = area;
                        largestPolygon = coords;
                    }
                }
                
                rawCoords = largestPolygon;
            }

            // Преобразование [longitude, latitude] в {latitude, longitude}
            let mappedCoords: GeoCoordinate[] = rawCoords.map((coord: number[]) => ({
                latitude: coord[1],
                longitude: coord[0]
            }));

            // Упрощение полигона для уменьшения нагрузки на рендеринг
            if (mappedCoords.length > maxPoints) {
                const step = Math.ceil(mappedCoords.length / maxPoints);
                const decimated = [];
                for (let i = 0; i < mappedCoords.length; i += step) {
                    decimated.push(mappedCoords[i]);
                }
                // Обеспечиваем замкнутость полигона
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
        } catch (fetchError) {
            // Обработка ошибок CORS и сети
            console.warn(`[Nominatim] Network/CORS error for ${cityName}:`, fetchError);
            return null;
        }

    } catch (error) {
        console.error(`[Nominatim] Error fetching boundary for ${cityName}:`, error);
        return null;
    }
}
