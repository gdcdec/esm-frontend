import { addressService } from '@/src/services/address';
import { AddressSearchResult } from '@/src/types';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  history: string[];
  setHistory: (history: string[]) => void;
  suggestions: AddressSearchResult[];
  isSearching: boolean;
  fetchSuggestions: (query: string) => void;
  handleSelectSuggestion: (item: AddressSearchResult) => string;
}

export function useSearch(initialQuery = ''): UseSearchReturn {
  const [query, setQuery] = useState(initialQuery);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchSuggestions = useCallback((searchQuery: string) => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await addressService.search(searchQuery);
        setSuggestions(results);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, []);

  const handleSelectSuggestion = useCallback((item: AddressSearchResult) => {
    const shortAddress = item.street
      ? `${item.street}${item.house ? ', ' + item.house : ''}${item.city ? ', ' + item.city : ''}`
      : item.display_name;

    setQuery(shortAddress);
    setHistory((prev) => (prev.includes(shortAddress) ? prev : [shortAddress, ...prev]));
    setSuggestions([]);
    return shortAddress;
  }, []);

  return {
    query,
    setQuery,
    history,
    setHistory,
    suggestions,
    isSearching,
    fetchSuggestions,
    handleSelectSuggestion,
  };
}
