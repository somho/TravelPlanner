"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker, Autocomplete, InfoWindow } from "@react-google-maps/api";
import { BookmarkIcon, MapPinIcon, ExternalLinkIcon, LinkIcon, CalendarIcon } from "lucide-react";
import { Place, Category, TravelEvent } from "@/types";

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

// V2 Default to Osaka City (Dotonbori)
const defaultCenter = {
    lat: 34.6687,
    lng: 135.5013,
};

interface MapSectionProps {
    onAddBookmark: (place: Place) => void;
    categories: Category[];
    bookmarks: Place[];
    events: TravelEvent[];
    activeFocusId?: string | null;
    onFocusCleared?: () => void;
}

export default function MapSection({ onAddBookmark, categories, bookmarks, events, activeFocusId, onFocusCleared }: MapSectionProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // Right click context state
    const [contextMenu, setContextMenu] = useState<{ lat: number, lng: number } | null>(null);

    // URL Input state
    const [urlInput, setUrlInput] = useState("");

    // Handle automated focus/panning
    useEffect(() => {
        if (activeFocusId && map) {
            if (activeFocusId === "FUKUOKA") {
                map.panTo(defaultCenter);
                map.setZoom(13);
                setActiveMarkerId(null);
                if (onFocusCleared) onFocusCleared();
                return;
            }

            const bookmark = bookmarks.find(b => b.id === activeFocusId);
            if (bookmark) {
                map.panTo({ lat: bookmark.lat, lng: bookmark.lng });
                map.setZoom(16);
                setActiveMarkerId(bookmark.id);
                // Optional: clear focus in parent after pan to allow re-triggering same location
                if (onFocusCleared) onFocusCleared();
            }
        }
    }, [activeFocusId, map, bookmarks, onFocusCleared]);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const onLoadAutocomplete = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place && place.geometry && place.geometry.location) {
                const newPlace: Place = {
                    id: place.place_id || Date.now().toString(),
                    name: place.name || "알 수 없는 장소",
                    address: place.formatted_address || "",
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    externalUrl: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
                };
                handleSetSelectedPlace(newPlace);
                if (map) {
                    map.panTo({ lat: newPlace.lat, lng: newPlace.lng });
                    map.setZoom(15);
                }
            }
        }
    };

    // Extract from typical map URLs, e.g. /@33.59,130.40,15z
    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput) return;

        try {
            const match = urlInput.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (match) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);
                const newPlace: Place = {
                    id: Date.now().toString(),
                    name: "링크에서 추출됨",
                    address: "사용자 지정 장소",
                    lat,
                    lng,
                    externalUrl: urlInput
                };
                handleSetSelectedPlace(newPlace);
                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(15);
                }
                setUrlInput("");
            } else {
                alert("이 URL에서 좌표를 추출할 수 없습니다. 긴 형태의 구글 맵 URL을 사용하거나 텍스트 검색을 이용해 주세요.");
            }
        } catch {
            alert("잘못된 URL 형식입니다.");
        }
    };

    const handleMapRightClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setContextMenu({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            });
            handleSetSelectedPlace(null);
        }
    };

    const handleAddRightClickBookmark = () => {
        if (contextMenu) {
            const newPlace: Place = {
                id: Date.now().toString(),
                name: "직접 핀을 꽂은 장소",
                address: `${contextMenu.lat.toFixed(4)}, ${contextMenu.lng.toFixed(4)}`,
                lat: contextMenu.lat,
                lng: contextMenu.lng,
            };
            handleSetSelectedPlace(newPlace); // Preview it instead of auto saving
            setContextMenu(null);
        }
    };

    const [bookmarkCategory, setBookmarkCategory] = useState<string>("");
    const [customTitle, setCustomTitle] = useState("");

    // Reset custom title when selecting a new place
    const handleSetSelectedPlace = (place: Place | null) => {
        setSelectedPlace(place);
        if (place) {
            setCustomTitle(place.name || "");
        } else {
            setCustomTitle("");
        }
    };

    const handleBookmark = () => {
        if (selectedPlace) {
            onAddBookmark({
                ...selectedPlace,
                name: customTitle || selectedPlace.name,
                categoryId: bookmarkCategory || undefined
            });
            handleSetSelectedPlace(null);
            setBookmarkCategory("");
        }
    };

    // Custom marker colors via SVG path
    const getMarkerIcon = (categoryId?: string | null) => {
        const defaultColor = "#E60012";
        const cat = categories.find(c => c.id === categoryId);
        const scale = 1.2;
        return {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: cat ? cat.color : defaultColor,
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
            scale: 6 * scale,
        };
    };

    if (loadError) return <div className="p-4 text-primary">지도를 불러오는 중 오류가 발생했습니다. API 키를 확인해 주세요.</div>;
    if (!isLoaded) return <div className="p-4 flex items-center justify-center h-full">지도 불러오는 중...</div>;

    return (
        <div className="relative w-full h-full flex flex-col bg-muted">

            {/* Top Overlay: Search & URL Parsing */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">

                {/* Row 1: Places Autocomplete */}
                <div className="flex gap-2">
                    <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged} className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="일본 장소 검색..."
                                className="w-full pl-10 pr-4 py-3 bg-background/90 backdrop-blur-md rounded-xl shadow-lg border hover:bg-background focus:bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                            <MapPinIcon className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                        </div>
                    </Autocomplete>
                </div>

                {/* Row 2: URL Input */}
                <form onSubmit={handleUrlSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            placeholder="또는 구글 맵 긴 URL을 여기에 붙여넣으세요..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-background/90 backdrop-blur-md rounded-xl shadow-md border hover:bg-background focus:bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                        <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    </div>
                    <button type="submit" className="px-4 bg-secondary text-secondary-foreground text-sm font-semibold rounded-xl shadow-md border bg-background/90 hover:bg-muted transition-colors">
                        추출
                    </button>
                </form>

            </div>

            <div className="flex-1">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={defaultCenter}
                    zoom={13}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onRightClick={handleMapRightClick}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapId: "dffb45d2f80ec3ed", // optional
                        clickableIcons: false
                    }}
                >
                    {/* Render Active Search/Add Selection */}
                    {selectedPlace && (
                        <Marker
                            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                            title={selectedPlace.name}
                            animation={google.maps.Animation.DROP}
                            icon={getMarkerIcon(selectedPlace.categoryId)}
                        />
                    )}

                    {/* Render Bookmarks */}
                    {bookmarks.map(b => (
                        <Marker
                            key={b.id}
                            position={{ lat: b.lat, lng: b.lng }}
                            title={b.name}
                            icon={getMarkerIcon(b.categoryId)}
                            onClick={() => setActiveMarkerId(b.id)}
                        >
                            {activeMarkerId === b.id && (
                                <InfoWindow onCloseClick={() => setActiveMarkerId(null)}>
                                    <div className="p-1 max-w-[200px] text-black">
                                        <h4 className="font-bold text-sm mb-1">{b.name}</h4>
                                        <p className="text-xs text-muted-foreground mb-2">{b.address}</p>

                                        {/* Linked Events */}
                                        {events.filter(e => e.location?.id === b.id).length > 0 && (
                                            <div className="mt-2 pt-2 border-t">
                                                <p className="text-[10px] font-semibold text-primary mb-1 flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3" /> 연관된 일정
                                                </p>
                                                <ul className="text-xs space-y-1">
                                                    {events.filter(e => e.location?.id === b.id).map(e => (
                                                        <li key={e.id} className="truncate">
                                                            {e.title} <span className="opacity-70">({e.author})</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {b.externalUrl && (
                                            <a href={b.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
                                                구글 맵에서 열기
                                            </a>
                                        )}
                                    </div>
                                </InfoWindow>
                            )}
                        </Marker>
                    ))}

                    {/* Render Right Click Preview Marker */}
                    {contextMenu && (
                        <Marker
                            position={contextMenu}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                fillColor: "#000",
                                fillOpacity: 0.5,
                                scale: 6,
                                strokeColor: "white",
                                strokeWeight: 2,
                            }}
                        />
                    )}
                </GoogleMap>
            </div>

            {/* Right Click Action Modal */}
            {contextMenu && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-card rounded-xl shadow-2xl p-4 border w-64 animate-in zoom-in-95 duration-200">
                    <h3 className="font-bold text-sm mb-2">위치 지정됨</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                        위도: {contextMenu.lat.toFixed(4)}<br />
                        경도: {contextMenu.lng.toFixed(4)}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setContextMenu(null)}
                            className="flex-1 bg-muted hover:bg-muted/80 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleAddRightClickBookmark}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            선택
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Selected Action Bar */}
            {selectedPlace && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 w-[95%] max-w-2xl bg-card/95 backdrop-blur-md rounded-2xl shadow-xl p-4 border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg truncate flex items-center gap-2">
                            <input
                                type="text"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none text-lg truncate flex-1"
                                placeholder="장소 이름 입력"
                            />
                            {selectedPlace.externalUrl && (
                                <a href={selectedPlace.externalUrl} target="_blank" rel="noreferrer" title="구글 맵에서 열기" className="text-primary hover:text-primary/80 transition-colors">
                                    <ExternalLinkIcon className="w-4 h-4" />
                                </a>
                            )}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{selectedPlace.address}</p>
                    </div>

                    <div className="flex gap-2 items-center flex-none">
                        <select
                            value={bookmarkCategory}
                            onChange={e => setBookmarkCategory(e.target.value)}
                            className="px-3 py-2 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary h-[42px]"
                        >
                            <option value="">카테고리 없음</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleBookmark}
                            className="px-5 h-[42px] bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 flex items-center gap-2 transition-colors"
                        >
                            <BookmarkIcon className="w-4 h-4 fill-current" />
                            <span>저장</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
