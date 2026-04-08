import { useIsMobile } from '@/src/hooks/useIsMobile';
import { useMapState } from '@/src/hooks/useMapState';
import { Platform } from 'react-native';
import { WebSidebar } from '@/src/components/map-screen/WebSidebar';
import { MobileBottomSheet } from '@/src/components/map-screen/MobileBottomSheet';
import { NativeBottomSheet } from '@/src/components/map-screen/NativeBottomSheet';

const isWeb = Platform.OS === 'web';

export default function MapScreen() {
  const isMobile = useIsMobile();
  const state = useMapState();

  if (!isWeb) return <NativeBottomSheet state={state} />;
  return isMobile ? <MobileBottomSheet state={state} /> : <WebSidebar state={state} />;
}
