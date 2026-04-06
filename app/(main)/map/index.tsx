import { useIsMobile } from '@/src/hooks/useIsMobile';
import { useMapState } from '@/src/hooks/useMapState';
import { Platform } from 'react-native';
import { WebSidebar } from './components/WebSidebar';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { NativeBottomSheet } from './components/NativeBottomSheet';

const isWeb = Platform.OS === 'web';

export default function MapScreen() {
  const isMobile = useIsMobile();
  const state = useMapState();

  if (!isWeb) return <NativeBottomSheet state={state} />;
  return isMobile ? <MobileBottomSheet state={state} /> : <WebSidebar state={state} />;
}
