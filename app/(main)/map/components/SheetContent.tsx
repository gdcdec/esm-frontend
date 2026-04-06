import { InlineFilters } from '@/src/components/map/InlineFilters';
import { ReportDetail } from '@/src/components/map/ReportDetail';
import { ReportCard } from '@/src/components/ReportCard';
import { Button } from '@/src/components/ui';
import { Report } from '@/src/types';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ReturnType } from './useSheetState';

interface SheetContentProps {
  state: ReturnType;
  isDarkMode: boolean;
  onCloseDetail: () => void;
  variant?: 'web' | 'native';
}

export function SheetContent({ state, isDarkMode, onCloseDetail, variant = 'web' }: SheetContentProps) {
  const handleAddReport = () => {
    const address = state.activeReports?.[0]?.address || '';
    const lat = String(state.activeReports?.[0]?.latitude);
    const lon = String(state.activeReports?.[0]?.longitude);
    router.push({
      pathname: '/(main)/create',
      params: { address, lat, lon },
    });
  };

  const handleReportPress = (report: Report) => {
    state.setActiveReports([report]);
  };

  if (state.singleReport) {
    return (
      <ReportDetail
        report={state.singleReport}
        onClose={onCloseDetail}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (state.activeReports && state.activeReports.length > 0) {
    return (
      <View>
        <View className="flex-row justify-between items-center mb-4 py-2 border-b border-gray-50 dark:border-gray-800">
          <View>
            <Text className="font-bold text-lg text-gray-900 dark:text-gray-100">Жалобы по адресу</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {state.activeReports[0].address || 'Адрес не определен'}
            </Text>
          </View>
          <TouchableOpacity onPress={onCloseDetail}>
            <X size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        <Button title="Добавить жалобу здесь" onPress={handleAddReport} className="mb-4" />
        {state.activeReports.map((item) => (
          <ReportCard
            key={item.id}
            report={item}
            onPress={() => handleReportPress(item)}
          />
        ))}
      </View>
    );
  }

  return (
    <View>
      <InlineFilters state={state} isDarkMode={isDarkMode} />
      {state.filteredReports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onPress={() => handleReportPress(report)}
        />
      ))}
      {state.filteredReports.length === 0 && (
        <View className="py-10 items-center">
          <Text className="text-gray-400">Ничего не найдено</Text>
        </View>
      )}
    </View>
  );
}
