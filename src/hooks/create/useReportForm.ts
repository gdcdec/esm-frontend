import { SelectedPhoto } from '@/src/components/InlineGallery';
import { addressService } from '@/src/services/address';
import { photosService } from '@/src/services/photos';
import { reportsService } from '@/src/services/reports';
import { useReportsStore } from '@/src/store/reportsStore';
import { useRubricsStore } from '@/src/store/rubricsStore';
import { AddressSearchResult, Report, ReportPhoto } from '@/src/types';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 100;
const MIN_DESC_LENGTH = 10;
const MAX_DESC_LENGTH = 2000;

const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
    onOk?.();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
};

const showConfirm = (title: string, message: string, onYes: () => void, onNo: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) {
      onYes();
    } else {
      onNo();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Нет', style: 'destructive', onPress: onNo },
      { text: 'Сохранить', onPress: onYes },
    ]);
  }
};

export interface ReportFormState {
  category: string | null;
  title: string;
  address: string;
  description: string;
  photos: SelectedPhoto[];
  existingPhotos: ReportPhoto[];
  deletedPhotoIds: number[];
  isSubmitting: boolean;
  isFetchingInitial: boolean;
  formError: string | null;
  selectedLocation: { lat: number; lon: number } | null;
  originalReportStatus: string | null;
  suggestions: AddressSearchResult[];
  isSearching: boolean;
}

export interface ReportFormActions {
  setCategory: (category: string | null) => void;
  setTitle: (title: string) => void;
  setAddress: (address: string) => void;
  setDescription: (desc: string) => void;
  handleSelectAddress: (item: AddressSearchResult) => void;
  pickFromGallery: () => Promise<void>;
  removePhoto: (index: number, isExisting: boolean) => void;
  setPhotos: (photos: SelectedPhoto[]) => void;
  handleSubmit: () => Promise<void>;
  handleClose: () => boolean;
  clearFormError: () => void;
}

export function useReportForm(): [ReportFormState, ReportFormActions] {
  const params = useLocalSearchParams<{
    address?: string;
    lat?: string;
    lon?: string;
    editId?: string;
    draftId?: string;
  }>();

  const isRubricsLoaded = useRubricsStore((s) => s.isLoaded);

  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState(params.address ?? '');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ReportPhoto[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(!!params.editId || !!params.draftId);
  const [originalReportStatus, setOriginalReportStatus] = useState<string | null>(null);
  const [formError, setFormErrorState] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const formErrorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preventSearchRef = useRef(false);

  const setFormError = (msg: string | null) => {
    setFormErrorState(msg);
    if (formErrorTimeout.current) clearTimeout(formErrorTimeout.current);
    if (msg) {
      formErrorTimeout.current = setTimeout(() => setFormErrorState(null), 3000);
    }
  };

  useEffect(() => {
    (async () => {
      if (!isRubricsLoaded) {
        await useRubricsStore.getState().fetchRubrics();
      }

      if (params.editId) {
        try {
          const report = await useReportsStore.getState().getById(parseInt(params.editId));
          setTitle(report.title);
          setAddress(report.address);
          setDescription(report.description);
          setCategory(report.rubric_name);
          setSelectedLocation({ lat: report.latitude, lon: report.longitude });
          setOriginalReportStatus(report.status || null);
          if (report.photos) setExistingPhotos(report.photos);
        } catch (err) {
          console.warn('Failed to fetch report:', err);
        }
      } else if (params.draftId) {
        const draft = useReportsStore.getState().getDraft(params.draftId);
        if (draft) {
          setTitle(draft.title);
          setAddress(draft.address);
          setDescription(draft.description);
          setCategory(draft.rubric);
          setSelectedLocation({ lat: draft.latitude, lon: draft.longitude });
          const draftPhotos: SelectedPhoto[] = draft.photoUris.map((uri, i) => ({
            uri,
            name: `draft_photo_${i}.jpg`,
            type: 'image/jpeg',
          }));
          setPhotos(draftPhotos);
        }
      }
      setIsFetchingInitial(false);
    })();
  }, [params.editId, params.draftId, isRubricsLoaded]);

  useEffect(() => {
    if (address.length < 3) {
      setSuggestions([]);
      return;
    }
    if (preventSearchRef.current) {
      preventSearchRef.current = false;
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await addressService.search(address);
        setSuggestions(results);
      } catch (e) {
        console.warn('Address search fail', e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [address]);

  const handleSelectAddress = useCallback((item: AddressSearchResult) => {
    preventSearchRef.current = true;

    let shortAddress = '';
    const { street, house, city } = item;

    if (house && street) {
      const cityStr = city ? `, ${city}` : '';
      shortAddress = `${street}, ${house}${cityStr}`;
    } else {
      shortAddress = item.display_name;
    }

    setAddress(shortAddress);
    setSelectedLocation({ lat: item.latitude, lon: item.longitude });
    setSuggestions([]);
  }, []);

  const pickFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const newPhotos: SelectedPhoto[] = result.assets
        .filter((a) => {
          const mime = a.mimeType ?? '';
          const size = a.fileSize ?? 0;
          if (mime && !ALLOWED_TYPES.includes(mime)) return false;
          if (size > MAX_FILE_SIZE) return false;
          return true;
        })
        .map((a) => ({
          uri: a.uri,
          name: a.fileName ?? `photo_${Date.now()}.jpg`,
          type: a.mimeType ?? 'image/jpeg',
        }));
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    }
  }, [photos.length]);

  const removePhoto = useCallback((index: number, isExisting: boolean) => {
    if (isExisting) {
      const removed = existingPhotos[index];
      if (removed) {
        setDeletedPhotoIds((prev) => [...prev, removed.id]);
      }
      setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPhotos((prev) => prev.filter((_, i) => i !== index));
    }
  }, [existingPhotos]);

  const hasData = !!(title || description || category || address !== (params.address ?? '') || photos.length > 0);

  const handleClose = useCallback((): boolean => {
    if (params.editId || !hasData) {
      return false;
    }

    if (params.draftId) {
      const lat = selectedLocation?.lat ?? (params.lat ? parseFloat(params.lat) : 0);
      const lon = selectedLocation?.lon ?? (params.lon ? parseFloat(params.lon) : 0);

      useReportsStore.getState().updateDraft(params.draftId, {
        title: title || 'Без названия',
        description,
        address,
        latitude: lat,
        longitude: lon,
        rubric: category,
        photoUris: photos.map((p) => p.uri),
      });
      showAlert('Черновик обновлён', 'Изменения сохранены.', () => {
        router.back();
      });
      return true;
    }

    showConfirm(
      'Сохранить черновик?',
      'У вас есть несохранённые данные. Сохранить как черновик?',
      () => {
        const lat = selectedLocation?.lat ?? (params.lat ? parseFloat(params.lat) : 0);
        const lon = selectedLocation?.lon ?? (params.lon ? parseFloat(params.lon) : 0);

        useReportsStore.getState().saveDraft({
          title: title || 'Без названия',
          description,
          address,
          latitude: lat,
          longitude: lon,
          rubric: category,
          photoUris: photos.map((p) => p.uri),
        });

        showAlert('Черновик сохранён', 'Заявка сохранена как черновик.', () => {
          router.back();
        });
      },
      () => {
        router.back();
      }
    );
    return true;
  }, [params.editId, params.draftId, hasData, title, description, address, category, selectedLocation, photos, params.address, params.lat, params.lon]);

  const handleSubmit = useCallback(async () => {
    setFormError(null);
    if (!category || !title || !address) {
      setFormError('Заполните обязательные поля');
      return;
    }

    if (title.length < MIN_TITLE_LENGTH) {
      setFormError(`Название должно содержать минимум ${MIN_TITLE_LENGTH} символов`);
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      setFormError(`Название не должно превышать ${MAX_TITLE_LENGTH} символов`);
      return;
    }
    if (description.length < MIN_DESC_LENGTH) {
      setFormError(`Описание должно содержать минимум ${MIN_DESC_LENGTH} символов`);
      return;
    }
    if (description.length > MAX_DESC_LENGTH) {
      setFormError(`Описание не должно превышать ${MAX_DESC_LENGTH} символов`);
      return;
    }

    const lat = selectedLocation?.lat ?? (params.lat ? parseFloat(params.lat) : 0);
    const lon = selectedLocation?.lon ?? (params.lon ? parseFloat(params.lon) : 0);

    setIsSubmitting(true);
    try {
      let report: Report;
      if (params.editId) {
        const isDraft = originalReportStatus === 'draft';
        report = await reportsService.update(parseInt(params.editId), {
          title,
          description,
          address,
          latitude: lat,
          longitude: lon,
          rubric: category,
          ...(isDraft && { status: 'check' }),
        });
      } else {
        report = await reportsService.create({
          title,
          description,
          address,
          latitude: lat,
          longitude: lon,
          rubric: category,
        });
      }

      if (params.editId && deletedPhotoIds.length > 0) {
        for (const photoId of deletedPhotoIds) {
          try {
            await photosService.delete(report.id, photoId);
          } catch (delErr: any) {
            console.warn('Failed to delete photo:', photoId, delErr);
          }
        }
      }

      if (photos.length > 0) {
        try {
          await photosService.upload(report.id, photos);
        } catch (photoErr: any) {
          const photoMsg = photoErr?.response?.data?.detail || photoErr?.message;
          showAlert(
            params.editId ? 'Заявка обновлена' : 'Заявка создана',
            `Заявка сохранена, но фото не загружены: ${photoMsg}`
          );
          return;
        }
      }

      showAlert('Успех', params.editId ? 'Заявка обновлена!' : 'Заявка отправлена на рассмотрение!', () => {
        if (params.draftId) {
          useReportsStore.getState().removeDraft(params.draftId);
        }
        // Очищаем данные формы чтобы handleClose не сохранил снова
        setTitle('');
        setAddress('');
        setDescription('');
        setCategory(null);
        setPhotos([]);
        router.back();
      });
    } catch (e: any) {
      const isOffline = !e.response && !e.status;

      if (!params.editId && isOffline) {
        useReportsStore.getState().saveDraft({
          title,
          description,
          address,
          latitude: lat,
          longitude: lon,
          rubric: category,
          photoUris: photos.map((p) => p.uri),
        });
        showAlert(
          'Нет подключения',
          'Заявка сохранена как черновик. Она будет автоматически отправлена при подключении к интернету.'
        );
        return;
      } else {
        let serverMsg = 'Не удалось сохранить заявку';
        if (e?.response?.data) {
          const data = e.response.data;
          if (data.description) {
            serverMsg = Array.isArray(data.description) ? data.description.join(', ') : data.description;
          } else if (data.detail) {
            serverMsg = data.detail;
          } else if (typeof data === 'string') {
            serverMsg = data;
          } else {
            serverMsg = JSON.stringify(data);
          }
        } else if (e?.message) {
          serverMsg = e.message;
        }
        setFormError(serverMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    category,
    title,
    address,
    description,
    selectedLocation,
    photos,
    deletedPhotoIds,
    params.editId,
    params.draftId,
    params.lat,
    params.lon,
    originalReportStatus,
  ]);

  const state: ReportFormState = {
    category,
    title,
    address,
    description,
    photos,
    existingPhotos,
    deletedPhotoIds,
    isSubmitting,
    isFetchingInitial,
    formError,
    selectedLocation,
    originalReportStatus,
    suggestions,
    isSearching,
  };

  const actions: ReportFormActions = {
    setCategory,
    setTitle,
    setAddress,
    setDescription,
    handleSelectAddress,
    pickFromGallery,
    removePhoto,
    setPhotos,
    handleSubmit,
    handleClose,
    clearFormError: () => setFormError(null),
  };

  return [state, actions];
}
