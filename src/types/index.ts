export interface Category {
    id: string;
    name: string;
    color: string;
}

export interface Place {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    url?: string;
    categoryId?: string | null;
    customName?: string;
    placeName?: string;
    memo?: string | null;
    externalUrl?: string; // Optional Google Maps link
    isPinned?: boolean;
}

export interface TravelEvent {
    id: string;
    title: string;
    category?: string;
    start: Date;
    end: Date;
    details: string;
    author: string;
    location?: Place;
}
