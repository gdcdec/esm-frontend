import { AppMapView } from '@/src/components/map-view';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/store/themeStore';
import { AddressSearchResult, Report } from '@/src/types';
import { router } from 'expo-router';
import { Locate, Minus, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CityAlertWeb } from './CityAlert';
import { PointCard } from './PointCard';
import { SearchDropdown } from './SearchDropdown';
import { SheetContent } from './SheetContent';
import { ReturnType } from './useSheetState';

const SNAP_PEEK = 80;

interface MobileBottomSheetProps {
  state: ReturnType;
}

export function MobileBottomSheet({ state }: MobileBottomSheetProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const user = useAuthStore((s) => s.user);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const SNAP_HALF = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.45) : 400;
  const SNAP_FULL = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.8) : 700;
  const snapPoints = useMemo(() => [SNAP_PEEK, SNAP_HALF, SNAP_FULL], []);

  const [sheetHeight, setSheetHeight] = useState(SNAP_PEEK);
  const [isDragging, setIsDragging] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const previousSheetHeight = useRef<number | null>(null);
  const isProgrammaticBack = useRef(false);

  const snapTo = useCallback((h: number) => {
    let closest = snapPoints[0];
    let minDist = Math.abs(h - closest);
    for (const sp of snapPoints) {
      const dist = Math.abs(h - sp);
      if (dist < minDist) {
        closest = sp;
        minDist = dist;
      }
    }
    setSheetHeight(closest);
  }, [snapPoints]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartHeight.current = sheetHeight;
    if (searchFocused) setSearchFocused(false);
  }, [sheetHeight, searchFocused]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const dy = dragStartY.current - e.touches[0].clientY;
    const newH = Math.max(SNAP_PEEK, Math.min(SNAP_FULL, dragStartHeight.current + dy));
    setSheetHeight(newH);
  }, [isDragging]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    snapTo(sheetHeight);
  }, [sheetHeight, snapTo]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = sheetHeight;
    e.preventDefault();
    if (searchFocused) setSearchFocused(false);
  }, [sheetHeight, searchFocused]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dy = dragStartY.current - e.clientY;
      const newH = Math.max(SNAP_PEEK, Math.min(SNAP_FULL, dragStartHeight.current + dy));
      setSheetHeight(newH);
    };
    const onUp = () => {
      setIsDragging(false);
      snapTo(sheetHeight);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, sheetHeight, snapTo]);

  const closeNextOverlay = useCallback(() => {
    if (searchFocused) {
      setSearchFocused(false);
      return true;
    }
    if (state.selectedCoord) {
      state.setSelectedCoord(null);
      state.setActiveReports(null);
      return true;
    }
    if (state.singleReport) {
      executeCloseDetail();
      return true;
    }
    if (state.activeReports) {
      executeCloseDetail();
      return true;
    }
    if (sheetHeight > SNAP_PEEK) {
      setSheetHeight(SNAP_PEEK);
      return true;
    }
    return false;
  }, [searchFocused, state.selectedCoord, state.singleReport, state.activeReports, sheetHeight]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasOverlay = searchFocused || !!state.selectedCoord || !!state.singleReport || !!state.activeReports || sheetHeight > SNAP_PEEK;
    if (hasOverlay) {
      if (window.location.hash !== '#overlay') {
        window.history.pushState(null, '', window.location.pathname + window.location.search + '#overlay');
      }
    } else {
      if (window.location.hash === '#overlay') {
        isProgrammaticBack.current = true;
        window.history.back();
      }
    }
  }, [searchFocused, state.selectedCoord, state.singleReport, state.activeReports, sheetHeight]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      if (isProgrammaticBack.current) {
        isProgrammaticBack.current = false;
        return;
      }
      const closedSomething = closeNextOverlay();
      if (closedSomething) {
        window.history.pushState(null, '', window.location.pathname + window.location.search + '#overlay');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeNextOverlay]);

  const handleSelectSuggestion = useCallback((item: AddressSearchResult) => {
    state.handleSelectSuggestion(item);
    setSearchFocused(false);
    searchInputRef.current?.blur();
    setSheetHeight(SNAP_PEEK);
  }, [state, SNAP_PEEK]);

  const executeCloseDetail = useCallback(() => {
    state.handleCloseDetail();
    if (previousSheetHeight.current === SNAP_PEEK) {
      setSheetHeight(SNAP_PEEK);
    }
    previousSheetHeight.current = null;
  }, [state.handleCloseDetail, SNAP_PEEK]);

  const handleMarkerPress = useCallback((clusterReports: Report[]) => {
    if (sheetHeight <= SNAP_PEEK) {
      previousSheetHeight.current = SNAP_PEEK;
      setSheetHeight(SNAP_HALF);
    } else if (!state.singleReport && !state.activeReports) {
      previousSheetHeight.current = null;
    }
    state.handleMarkerPress(clusterReports);
  }, [state.handleMarkerPress, sheetHeight, SNAP_PEEK, SNAP_HALF, state.singleReport, state.activeReports]);

  return (
    <div style={{ width: '100%', height: '100dvh', position: 'relative' as const, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'absolute' as const, inset: 0, zIndex: 0 }}>
        <AppMapView
          ref={state.mapRef}
          reports={state.reports}
          onMapPress={(coord) => {
            state.handleMapPress(coord);
            setSheetHeight(SNAP_PEEK);
            setSearchFocused(false);
          }}
          onMarkerPress={handleMarkerPress}
          selectedCoordinate={state.selectedCoord}
        />
      </div>

      <div style={{ position: 'absolute' as const, top: 12, left: 12, right: 12, zIndex: 50 }}>
        <div
          style={{
            background: isDarkMode ? '#1F2937' : 'white',
            borderRadius: 14,
            boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.12)',
            border: isDarkMode ? '1px solid #374151' : 'none',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            height: 48,
          }}
          onClick={() => {
            searchInputRef.current?.focus();
            setSearchFocused(true);
            setSheetHeight(SNAP_PEEK);
            state.setSelectedCoord(null);
            state.setActiveReports(null);
          }}
        >
          <Search size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Поиск по адресу..."
            value={state.searchQuery}
            onChange={(e) => {
              state.setSearchQuery(e.target.value);
              state.fetchSuggestions(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && state.searchQuery.trim()) {
                if (!state.searchHistory.includes(state.searchQuery.trim())) {
                  state.setSearchHistory([state.searchQuery.trim(), ...state.searchHistory]);
                }
                setSearchFocused(false);
                searchInputRef.current?.blur();
                setSheetHeight(SNAP_FULL);
              }
            }}
            onFocus={() => setSearchFocused(true)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              color: isDarkMode ? '#FFFFFF' : '#111827',
              padding: '0 10px',
              height: '100%',
              minWidth: 0,
            }}
          />
          {state.searchQuery && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                state.setSearchQuery('');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <X size={16} color="#9CA3AF" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8 }}>
          <button
            onClick={() => router.push('/(main)/profile')}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
              background: isDarkMode ? '#1F2937' : 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 'bold',
              color: isDarkMode ? '#FFFFFF' : '#111827',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            {user?.username?.charAt(0)?.toUpperCase() ?? '?'}
          </button>
        </div>

        {searchFocused && sheetHeight <= SNAP_PEEK && (
          <SearchDropdown
            query={state.searchQuery}
            suggestions={state.suggestions}
            searchHistory={state.searchHistory}
            isSearching={state.isSearching}
            onSelectSuggestion={handleSelectSuggestion}
            onSelectHistory={(item) => {
              state.setSearchQuery(item);
              setSearchFocused(false);
              setSheetHeight(SNAP_HALF);
            }}
            onClearHistory={() => state.setSearchHistory([])}
            onClearQuery={() => state.setSearchQuery('')}
            variant="mobile"
          />
        )}
      </div>

      <div style={{ position: 'absolute' as const, right: 12, top: '30%', zIndex: 50, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <button
          onClick={() => state.mapRef.current?.zoomIn()}
          style={{
            width: 44, height: 44, borderRadius: 22,
            border: isDarkMode ? '1px solid #374151' : 'none',
            background: isDarkMode ? '#1F2937' : 'white',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <Plus size={22} color={isDarkMode ? '#D1D5DB' : '#374151'} />
        </button>
        <button
          onClick={() => state.mapRef.current?.zoomOut()}
          style={{
            width: 44, height: 44, borderRadius: 22,
            border: isDarkMode ? '1px solid #374151' : 'none',
            background: isDarkMode ? '#1F2937' : 'white',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <Minus size={22} color={isDarkMode ? '#D1D5DB' : '#374151'} />
        </button>
        <button
          onClick={() => state.handleLocate()}
          style={{
            width: 44, height: 44, borderRadius: 22,
            border: isDarkMode ? '1px solid #374151' : 'none',
            background: isDarkMode ? '#1F2937' : 'white',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.12)',
            marginTop: 8,
          }}
        >
          <Locate size={22} color="#2563EB" />
        </button>
      </div>

      {!state.selectedCoord && !state.activeReports && sheetHeight <= SNAP_PEEK + 20 && (
        <button
          onClick={() =>
            router.push({
              pathname: '/(main)/create',
              params: {
                ...(state.userAddress ? { address: state.userAddress } : {}),
                ...(state.userLocation ? { lat: String(state.userLocation.latitude), lon: String(state.userLocation.longitude) } : {}),
              },
            })
          }
          style={{
            position: 'absolute' as const,
            bottom: SNAP_PEEK + 16, right: 16,
            zIndex: 50,
            width: 56, height: 56, borderRadius: 28,
            border: 'none', background: '#2563EB', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Plus size={28} color="#FFFFFF" />
        </button>
      )}

      {state.selectedCoord && (
        <PointCard
          coordinate={state.selectedCoord}
          address={state.selectedAddress}
          mapRef={state.mapRef}
          onClose={() => state.setSelectedCoord(null)}
          variant="mobile"
        />
      )}

      <div
        style={{
          position: 'absolute' as const,
          bottom: 0, left: 0, right: 0,
          height: sheetHeight,
          zIndex: 40,
          background: isDarkMode ? '#1F2937' : 'white',
          borderRadius: '20px 20px 0 0',
          boxShadow: isDarkMode ? '0 -4px 20px rgba(0,0,0,0.4)' : '0 -4px 20px rgba(0,0,0,0.1)',
          transition: isDragging ? 'none' : 'height 0.3s ease-out',
          display: state.selectedCoord ? 'none' : 'flex',
          flexDirection: 'column' as const,
          overflow: 'hidden',
        }}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          style={{
            padding: '12px 0 8px',
            cursor: 'grab',
            display: 'flex', justifyContent: 'center',
            flexShrink: 0,
            userSelect: 'none' as const,
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
        </div>

        <div style={{ flex: 1, overflowY: sheetHeight > SNAP_PEEK ? 'auto' : 'hidden', padding: '0 16px 16px' }}>
          <SheetContent state={state} isDarkMode={isDarkMode} onCloseDetail={executeCloseDetail} variant="web" />
        </div>
      </div>

      {state.showCityAlert && <CityAlertWeb message={state.alertMessage} onClose={() => state.setShowCityAlert(false)} />}
    </div>
  );
}
