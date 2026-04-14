import { ReportFilters } from '@/src/components/FiltersModal';
import { AddressSearchResult, MapViewRef, Report } from '@/src/types';
import { CityBoundaryData } from '@/src/utils/fetchCityBoundary';
import React from 'react';

export type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

export interface SheetState {
  reports: Report[];
  selectedCoord: { latitude: number; longitude: number } | null;
  setSelectedCoord: SetState<{ latitude: number; longitude: number } | null>;
  selectedAddress: string | null;
  setSelectedAddress: SetState<string | null>;
  activeReports: Report[] | null;
  setActiveReports: SetState<Report[] | null>;
  searchQuery: string;
  setSearchQuery: SetState<string>;
  searchHistory: string[];
  setSearchHistory: SetState<string[]>;
  mapRef: React.RefObject<MapViewRef | null>;
  singleReport: Report | null;
  filteredReports: Report[];
  userLocation: { latitude: number; longitude: number } | null;
  userAddress: string | null;
  isLoadingReports: boolean;
  fetchReports: (filters?: ReportFilters) => Promise<void>;
  handleMapPress: (coordinate: { latitude: number; longitude: number }) => Promise<void>;
  handleMarkerPress: (clusterReports: Report[]) => void;
  handleCloseDetail: () => void;
  handleLocate: () => Promise<void>;
  handleSelectSuggestion: (item: AddressSearchResult) => string;
  filters: ReportFilters;
  setFilters: SetState<ReportFilters>;
  rubrics: string[];
  suggestions: AddressSearchResult[];
  setSuggestions: SetState<AddressSearchResult[]>;
  isSearching: boolean;
  fetchSuggestions: (query: string) => void;
  showFilters: boolean;
  setShowFilters: SetState<boolean>;
  showMine: boolean;
  setShowMine: SetState<boolean>;
  cityBoundary: CityBoundaryData | null;
  showCityAlert: boolean;
  setShowCityAlert: SetState<boolean>;
  alertMessage: string;
}

export type ReturnType = SheetState;
