export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export type ReportStatus = 'draft' | 'published' | 'check' | 'archived' | 'banned';

export interface ReportPhoto {
    id: number;
    photo_url: string;
    order: number;
    caption: string;
    uploaded_at: string;
}

export interface Report {
    id: number;
    title: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    rubric_name: string | null;
    author_username: string;
    status: ReportStatus;
    created_at: string;
    preview_photo: string | null;
    photos?: ReportPhoto[];
    photo_count?: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    patronymic?: string;
    phone_number?: string;
    city?: string;
    level?: number;
    xp?: number;
    nextLevelXp?: number;
    avatar?: string;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface ApiRubric {
    name: string;
    counter: number;
}

export interface AddressReverseResponse {
    in_working_area: boolean;
    address: string;
    latitude: number;
    longitude: number;
    city: string;
    street: string;
    house: string;
}

export interface AddressSearchResult {
    display_name: string;
    latitude: number;
    longitude: number;
    city?: string;
    street?: string;
    house?: string;
}

export interface CreateReportPayload {
    title: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    rubric?: string;
}
