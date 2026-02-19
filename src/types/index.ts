// Types

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export type ReportStatus = 'pending' | 'progress' | 'solved';

export interface Report {
    id: number;
    lat: number;
    long: number;
    title: string;
    desc: string;
    address: string;
    status: ReportStatus;
    category: string;
    date: string;
    author: string;
    likes: number;
    comments: number;
    image: string | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    avatar?: string;
}

export interface Coordinates {
    latitude: number;
    longitude: number;
}
