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
    categoryId?: string;
    externalUrl?: string; // Optional Google Maps link
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
