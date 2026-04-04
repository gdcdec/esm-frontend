import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() =>
        isWeb ? window.innerWidth <= breakpoint : true
    );
    useEffect(() => {
        if (!isWeb) return;
        const handler = () => setIsMobile(window.innerWidth <= breakpoint);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [breakpoint]);
    return isMobile;
}
