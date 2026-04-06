import { AppMapView } from '@/src/components/map-view';
import { Button } from '@/src/components/ui';
import { useThemeStore } from '@/src/store/themeStore';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { CityAlertWeb } from './CityAlert';
import { PointCard } from './PointCard';
import { ProfileButton } from './ProfileButton';
import { SearchDropdown } from './SearchDropdown';
import { SheetContent } from './SheetContent';
import { ReturnType } from './useSheetState';
import { ZoomControls } from './ZoomControls';

const PANEL_WIDTH = 480;
type PanelMode = 'collapsed' | 'dropdown' | 'open';

interface WebSidebarProps {
  state: ReturnType;
}

export function WebSidebar({ state }: WebSidebarProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const [panelMode, setPanelMode] = useState<PanelMode>('open');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isOpen = panelMode === 'open';

  const handleSearchChange = (value: string) => {
    state.setSearchQuery(value);
    state.fetchSuggestions(value);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && state.searchQuery.trim()) {
      setPanelMode('open');
      setIsSearchFocused(false);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (panelMode === 'collapsed') setPanelMode('dropdown');
  };

  const handleSearchBlur = () => {
    setTimeout(() => setIsSearchFocused(false), 200);
  };

  const handleMapPress = (coord: { latitude: number; longitude: number }) => {
    state.handleMapPress(coord);
    if (panelMode === 'dropdown') setPanelMode('collapsed');
  };

  const handleSelectSuggestion = (item: { latitude: number; longitude: number }) => {
    state.handleSelectSuggestion(item);
    setPanelMode('open');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        position: 'relative' as const,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ position: 'absolute' as const, inset: 0, zIndex: 0 }}>
        <AppMapView
          ref={state.mapRef}
          reports={state.reports}
          selectedCoordinate={state.selectedCoord}
          onMapPress={handleMapPress}
          onMarkerPress={state.handleMarkerPress}
        />
      </div>

      <div
        style={{
          position: 'absolute' as const,
          top: 16,
          left: 16,
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div
          style={{
            width: PANEL_WIDTH - 32,
            background: isDarkMode ? '#1F2937' : 'white',
            borderRadius: isOpen ? '16px 16px 16px 16px' : 16,
            boxShadow: isOpen ? 'none' : isDarkMode ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.12)',
            border: isDarkMode ? '1px solid #374151' : 'none',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative' as const,
              background: isOpen
                ? isDarkMode
                  ? '#1F2937'
                  : '#F3F4F6'
                : isDarkMode
                ? '#111827'
                : 'white',
              borderRadius: 14,
              padding: '0 12px',
              height: 48,
            }}
          >
            <Search size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск по адресу..."
              value={state.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchSubmit}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 16,
                fontWeight: 500,
                color: isDarkMode ? '#FFFFFF' : '#111827',
                padding: '0 10px',
                height: '100%',
                minWidth: 0,
              }}
            />
          </div>

          {(isSearchFocused || panelMode === 'dropdown') &&
            ((state.searchQuery.length >= 3 && (state.isSearching || state.suggestions.length > 0)) ||
              (!state.searchQuery && state.searchHistory.length > 0)) && (
              <div style={{ padding: '0 16px 16px' }}>
                <SearchDropdown
                  query={state.searchQuery}
                  suggestions={state.suggestions}
                  searchHistory={state.searchHistory}
                  isSearching={state.isSearching}
                  onSelectSuggestion={handleSelectSuggestion}
                  onSelectHistory={(item) => {
                    state.setSearchQuery(item);
                    setPanelMode('open');
                  }}
                  onClearHistory={() => state.setSearchHistory([])}
                  onClearQuery={() => state.setSearchQuery('')}
                  variant="web"
                />
              </div>
            )}
        </div>

        <button
          onClick={() => setPanelMode(isOpen ? 'collapsed' : 'open')}
          style={{
            position: 'absolute' as const,
            left: PANEL_WIDTH - 16 + 8,
            top: 4,
            width: 40,
            height: 40,
            borderRadius: 10,
            border: isDarkMode ? '1px solid #374151' : 'none',
            background: isDarkMode ? '#111827' : 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.12)',
            flexShrink: 0,
          }}
        >
          {isOpen ? (
            <ChevronLeft size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
          ) : (
            <ChevronRight size={20} color={isDarkMode ? '#D1D5DB' : '#374151'} />
          )}
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute' as const,
            top: 0,
            left: 0,
            width: PANEL_WIDTH,
            height: '100%',
            backgroundColor: isDarkMode ? '#1F2937' : 'white',
            borderRight: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column' as const,
            zIndex: 20,
            boxShadow: isDarkMode ? '4px 0 16px rgba(0,0,0,0.3)' : '4px 0 16px rgba(0,0,0,0.08)',
            paddingTop: 84,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto' as const,
              padding: '0 16px 16px',
              scrollbarWidth: isDarkMode ? 'thin' : 'auto',
              scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : 'auto',
            }}
          >
            <SheetContent
              state={state}
              isDarkMode={isDarkMode}
              onCloseDetail={state.handleCloseDetail}
              variant="web"
            />
          </div>

          <div style={{ padding: 16 }}>
            <Button
              title="+ Сообщить о проблеме"
              onPress={() =>
                router.push({
                  pathname: '/(main)/create',
                  params: {
                    ...(state.userAddress ? { address: state.userAddress } : {}),
                    ...(state.userLocation
                      ? { lat: String(state.userLocation.latitude), lon: String(state.userLocation.longitude) }
                      : {}),
                  },
                })
              }
            />
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
        <ProfileButton />
      </div>

      <ZoomControls mapRef={state.mapRef} onLocate={state.handleLocate} />

      {state.selectedCoord && (
        <PointCard
          coordinate={state.selectedCoord}
          address={state.selectedAddress}
          mapRef={state.mapRef}
          onClose={() => state.setSelectedCoord(null)}
          variant="web"
        />
      )}

      {state.showCityAlert && <CityAlertWeb message={state.alertMessage} onClose={() => state.setShowCityAlert(false)} />}
    </div>
  );
}
