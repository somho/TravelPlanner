// src/hooks/useRealtimeTravelData.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TravelEvent, Category, Place } from '@/types';

export function useRealtimeTravelData() {
    const [events, setEvents] = useState<TravelEvent[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [bookmarks, setBookmarks] = useState<Place[]>([]);
    const [notepadContent, setNotepadContent] = useState<string>('');
    const [tripSettings, setTripSettings] = useState<{ startDate: Date | null, endDate: Date | null }>({ startDate: null, endDate: null });

    useEffect(() => {
        // 1. 초기 데이터 가져오기
        const fetchInitialData = async () => {
            const { data: catData } = await supabase.from('categories').select('*');
            const { data: evtData } = await supabase.from('events').select('*');
            const { data: bookData } = await supabase.from('bookmarks').select('*');
            const { data: noteData } = await supabase.from('notepad').select('*').eq('id', 'main').maybeSingle();
            const { data: setData, error: setError } = await supabase.from('settings').select('*').eq('id', 'main').maybeSingle();

            if (setError) console.error('Error fetching settings:', setError);

            if (catData) setCategories(catData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
            if (evtData) setEvents(evtData.map(e => ({
                ...e,
                start: new Date(e.startTime),
                end: new Date(e.endTime),
                category: e.categoryId,
                details: e.description,
                author: e.authorName,
                location: e.latitude && e.longitude ? { 
                    id: e.locationId || "",
                    name: e.locationName || "",
                    address: e.locationName || "",
                    lat: e.latitude, 
                    lng: e.longitude 
                } : undefined
            })));
            // src/hooks/useRealtimeTravelData.ts 내부 매핑 로직 수정
            if (bookData) setBookmarks(bookData.map(b => ({
                id: b.id,
                name: b.customName || b.placeName || "이름 없는 장소",
                lat: b.latitude,
                lng: b.longitude,
                address: b.placeName || "",
                url: b.googleMapUrl || "",
                categoryId: b.categoryId,
                isPinned: b.isPinned,
                memo: b.memo
            })));
            if (noteData) setNotepadContent(noteData.content);
            if (setData) setTripSettings({
                startDate: setData.startDate ? new Date(setData.startDate) : null,
                endDate: setData.endDate ? new Date(setData.endDate) : null
            });
        };

        fetchInitialData();

        // 2. 실시간 구독 (Realtime)
        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
                console.log('Realtime Categories:', payload);
                if (payload.eventType === 'INSERT') setCategories(prev => [...prev, payload.new as Category].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
                if (payload.eventType === 'UPDATE') setCategories(prev => prev.map(c => c.id === (payload.new as any).id ? payload.new as Category : c).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
                if (payload.eventType === 'DELETE') setCategories(prev => prev.filter(c => c.id !== payload.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
                console.log('Realtime Events:', payload);
                const mapped = payload.new ? {
                    ...(payload.new as any),
                    id: (payload.new as any).id,
                    title: (payload.new as any).title,
                    start: new Date((payload.new as any).startTime),
                    end: new Date((payload.new as any).endTime),
                    category: (payload.new as any).categoryId,
                    details: (payload.new as any).description,
                    author: (payload.new as any).authorName,
                    location: (payload.new as any).latitude && (payload.new as any).longitude ? { 
                        id: (payload.new as any).locationId || "",
                        name: (payload.new as any).locationName || "",
                        address: (payload.new as any).locationName || "",
                        lat: (payload.new as any).latitude, 
                        lng: (payload.new as any).longitude 
                    } : undefined
                } : null;

                if (payload.eventType === 'INSERT') setEvents(prev => [...prev, mapped as any]);
                if (payload.eventType === 'UPDATE') setEvents(prev => prev.map(e => e.id === mapped!.id ? mapped as any : e));
                if (payload.eventType === 'DELETE') setEvents(prev => prev.filter(e => e.id !== payload.old.id));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, (payload) => {
                console.log('Realtime Bookmarks:', payload);
                const mapped = payload.new ? {
                    id: (payload.new as any).id,
                    name: (payload.new as any).customName || (payload.new as any).placeName,
                    lat: (payload.new as any).latitude,
                    lng: (payload.new as any).longitude,
                    url: (payload.new as any).googleMapUrl,
                    categoryId: (payload.new as any).categoryId,
                    isPinned: (payload.new as any).isPinned,
                    memo: (payload.new as any).memo
                } : null;

                if (payload.eventType === 'INSERT') setBookmarks(prev => [...prev, mapped as any]);
                if (payload.eventType === 'UPDATE') setBookmarks(prev => prev.map(b => b.id === mapped!.id ? mapped as any : b));
                if (payload.eventType === 'DELETE') setBookmarks(prev => prev.filter(b => b.id !== payload.old.id));
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notepad' }, (payload) => {
                console.log('Realtime Notepad:', payload);
                if (payload.new && (payload.new as any).id === 'main') setNotepadContent((payload.new as any).content);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
                console.log('Realtime Settings:', payload);
                if (payload.new && (payload.new as any).id === 'main') {
                    setTripSettings({
                        startDate: (payload.new as any).startDate ? new Date((payload.new as any).startDate) : null,
                        endDate: (payload.new as any).endDate ? new Date((payload.new as any).endDate) : null
                    });
                }
            })
            .subscribe((status) => {
                console.log('Supabase Realtime Status:', status);
            });

        return () => {
            console.log('Cleaning up Supabase Realtime Channel');
            supabase.removeChannel(channel);
        };
    }, []);

    return { events, categories, bookmarks, notepadContent, setNotepadContent, tripSettings };
}