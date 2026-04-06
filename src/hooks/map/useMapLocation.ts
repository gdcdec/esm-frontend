import { addressService } from '@/src/services/address';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

interface UseLocationReturn {
  userLocation: { latitude: number; longitude: number } | null;
  userAddress: string | null;
  locate: () => Promise<{ latitude: number; longitude: number } | null>;
}

export function useMapLocation(): UseLocationReturn {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  const locate = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Геолокация', 'Нет доступа к геолокации. Включите в настройках.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coord);

      try {
        const res = await addressService.reverse(coord.latitude, coord.longitude);
        const formatted = res.street
          ? `${res.street}${res.house ? ', ' + res.house : ''}${res.city ? ', ' + res.city : ''}`
          : res.address;
        setUserAddress(formatted);
      } catch {
        setUserAddress(null);
      }
      return coord;
    } catch {
      Alert.alert('Ошибка', 'Не удалось определить местоположение');
      return null;
    }
  }, []);

  return {
    userLocation,
    userAddress,
    locate,
  };
}
