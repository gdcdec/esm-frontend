// API маршрут Expo Router для проксирования границ города
import { CityBoundaryData } from '@/src/utils/fetchCityBoundary';

async function handler(request: Request, { params }: { params: { city: string } }): Promise<Response> {
    const cityName = decodeURIComponent(params.city);
    
    try {
        const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&country=RU&polygon_geojson=1&format=json`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'MoyDonos-App/1.0 (Contact: support@moydonos.ru)',
            },
        });

        if (!response.ok) {
            console.error(`Nominatim API error: ${response.status}`);
            return Response.json(
                { error: 'Failed to fetch city boundary' },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return Response.json(
                { error: 'City not found' },
                { status: 404 }
            );
        }

        // Поиск наиболее подходящей административной границы
        let bestResult = data.find((row: any) => 
            row.geojson && 
            (row.type === 'city' || row.type === 'administrative') &&
            (row.geojson.type === 'Polygon' || row.geojson.type === 'MultiPolygon')
        );

        if (!bestResult) {
            bestResult = data.find((row: any) => 
                row.geojson && 
                (row.geojson.type === 'Polygon' || row.geojson.type === 'MultiPolygon')
            );
        }

        if (!bestResult) {
            return Response.json(
                { error: 'No boundary data found' },
                { status: 404 }
            );
        }

        let rawCoords: number[][] = [];

        if (bestResult.geojson.type === 'Polygon') {
            rawCoords = bestResult.geojson.coordinates[0];
        } else if (bestResult.geojson.type === 'MultiPolygon') {
            let largestPolygon: number[][] = [];
            let maxArea = 0;
            
            for (const polygon of bestResult.geojson.coordinates) {
                const coords = polygon[0];
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
        const coords = rawCoords.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0]
        }));

        // Упрощение полигона при слишком большом количестве точек
        if (coords.length > 200) {
            const step = Math.ceil(coords.length / 200);
            const decimated = [];
            for (let i = 0; i < coords.length; i += step) {
                decimated.push(coords[i]);
            }
            if (decimated.length > 0) {
                decimated.push(decimated[0]);
            }
            coords.splice(0, coords.length, ...decimated);
        }

        const result: CityBoundaryData = {
            coords: coords.reverse(),
            center: {
                latitude: parseFloat(bestResult.lat),
                longitude: parseFloat(bestResult.lon)
            }
        };

        // Кэширование на 1 час
        return Response.json(result, {
            headers: {
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        console.error('City boundary proxy error:', error);
        return Response.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Экспорт по умолчанию для Expo Router
export default function CityBoundaryRoute({ params }: { params: { city: string } }) {
    // Этот компонент обрабатывает API запрос
    return null;
}

// Также экспортируем обработчик для прямого использования API
export { handler as GET };

