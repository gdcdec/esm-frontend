import { useEffect, useState } from 'react';
import { CityBoundaryData, fetchCityBoundary } from '@/src/utils/fetchCityBoundary';

export function useCityBoundary(city: string | null) {
  const [cityBoundary, setCityBoundary] = useState<CityBoundaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) {
      setCityBoundary(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchCityBoundary(city)
      .then((data) => {
        if (data && data.coords.length > 0) {
          setCityBoundary(data);
        }
      })
      .catch(() => {
        setError('Failed to load city boundary');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [city]);

  return { cityBoundary, isLoading, error };
}
