"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Place, TravelEvent, Category } from "@/types";
import koLocale from "@fullcalendar/core/locales/ko";
import { useState, useRef, useEffect } from "react";
import { XIcon, MapPinIcon, PencilIcon, UtensilsIcon, ShoppingBagIcon, SparklesIcon, BikeIcon, CameraIcon } from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
    '식사': UtensilsIcon,
    '쇼핑': ShoppingBagIcon,
    '자유시간': SparklesIcon,
    '이동': BikeIcon,
    '관광': CameraIcon,
};

interface CalendarSectionProps {
    events: TravelEvent[];
    categories: Category[];
    onDateClick: (date: Date) => void;
    onEventClick: (event: TravelEvent) => void;
    onSaveSettings?: (startDate: Date | null, endDate: Date | null) => void;
    onShowLocation?: (place: Place) => void;
    tripSettings?: { startDate: Date | null, endDate: Date | null };
}

export default function CalendarSection({ 
    events, 
    categories, 
    onDateClick, 
    onEventClick, 
    onSaveSettings,
    onShowLocation, 
    tripSettings 
}: CalendarSectionProps) {
    const calendarRef = useRef<FullCalendar>(null);
    const [filterRange, setFilterRange] = useState<{ start: Date, end: Date } | null>(null);
    const [startDateInput, setStartDateInput] = useState("");
    const [endDateInput, setEndDateInput] = useState("");

    // SYNC with tripSettings from DB
    useEffect(() => {
        if (tripSettings?.startDate && tripSettings?.endDate) {
            const start = new Date(tripSettings.startDate);
            const end = new Date(tripSettings.endDate);
            
            setStartDateInput(start.toISOString().split('T')[0]);
            setEndDateInput(end.toISOString().split('T')[0]);

            const exclusiveEnd = new Date(end);
            exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
            setFilterRange({ start, end: exclusiveEnd });

            setTimeout(() => {
                const api = calendarRef.current?.getApi();
                if (api) {
                    api.gotoDate(start);
                    api.changeView('timeGridFilter');
                }
            }, 100);
        } else {
            setFilterRange(null);
            setStartDateInput("");
            setEndDateInput("");
            calendarRef.current?.getApi()?.changeView('timeGridWeek');
        }
    }, [tripSettings]);

    const [popoverEvent, setPopoverEvent] = useState<TravelEvent | null>(null);
    const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

    const formattedEvents = events.map(ev => {
        const cat = categories.find(c => c.id === ev.category);
        return {
            id: ev.id,
            title: ev.title,
            start: ev.start,
            end: ev.end,
            backgroundColor: cat ? cat.color : "#3b82f6",
            borderColor: "transparent",
            extendedProps: {
                author: ev.author,
                details: ev.details,
                location: ev.location,
                category: cat ? cat.name : "",
                categoryColor: cat ? cat.color : "#3b82f6"
            }
        };
    });

    const handleApplyFilter = () => {
        if (startDateInput && endDateInput) {
            const start = new Date(startDateInput);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDateInput);
            end.setHours(0, 0, 0, 0);

            if (start <= end) {
                // FullCalendar visibleRange 'end' is exclusive
                const exclusiveEnd = new Date(end);
                exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);

                setFilterRange({ start, end: exclusiveEnd });

                if (onSaveSettings) {
                    onSaveSettings(start, end);
                }

                setTimeout(() => {
                    const api = calendarRef.current?.getApi();
                    if (api) {
                        api.gotoDate(start);
                        api.changeView('timeGridFilter');
                    }
                }, 0);
            } else {
                alert("종료일은 시작일 혹은 그 이후여야 합니다.");
            }
        } else {
            alert("시작일과 종료일을 모두 선택해주세요.");
        }
    };

    const handleReset = () => {
        setFilterRange(null);
        setStartDateInput("");
        setEndDateInput("");
        if (onSaveSettings) {
            onSaveSettings(null, null);
        }
        calendarRef.current?.getApi()?.changeView('timeGridWeek');
    };

    return (
        <div className="h-full w-full weekly-planner flex flex-col relative gap-2">
            {/* Filter UI */}
            <div className="flex flex-col sm:flex-row gap-2 items-center bg-card border rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">기간 필터:</span>
                    <input
                        type="date"
                        value={startDateInput}
                        onChange={e => setStartDateInput(e.target.value)}
                        className="p-1.5 text-sm border rounded-md outline-none focus:ring-2 focus:ring-primary flex-1 min-w-0"
                    />
                    <span className="text-muted-foreground">~</span>
                    <input
                        type="date"
                        value={endDateInput}
                        onChange={e => setEndDateInput(e.target.value)}
                        className="p-1.5 text-sm border rounded-md outline-none focus:ring-2 focus:ring-primary flex-1 min-w-0"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleApplyFilter}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-md transition-colors"
                    >
                        적용
                    </button>
                    {filterRange && (
                        <button
                            onClick={handleReset}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-md transition-colors"
                        >
                            해제
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-card rounded-lg overflow-hidden border">
                <FullCalendar
                    ref={calendarRef}
                    selectable={false}
                    views={{
                        timeGridFilter: {
                            type: 'timeGrid',
                            duration: filterRange ? { days: Math.max(1, Math.round((filterRange.end.getTime() - filterRange.start.getTime()) / 86400000)) } : { days: 7 }
                        }
                    }}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    locale={koLocale}
                    headerToolbar={false}
                    events={formattedEvents}
                    dateClick={(info) => onDateClick(info.date)}
                    eventClick={(info) => {
                        const matchedEvent = events.find(e => e.id === info.event.id);
                        if (matchedEvent) {
                            if (matchedEvent.location) {
                                // Position popover near mouse
                                setPopoverEvent(matchedEvent);
                                setPopoverPos({ x: info.jsEvent.clientX, y: info.jsEvent.clientY });
                            } else {
                                onEventClick(matchedEvent);
                            }
                        }
                    }}
                    height="100%"
                    slotMinTime="06:00:00"
                    slotMaxTime="24:00:00"
                    allDaySlot={false}
                    nowIndicator={true}
                    eventContent={(arg) => {
                        const catName = arg.event.extendedProps.category;
                        const CategoryIcon = catName ? CATEGORY_ICONS[catName] : null;

                        return (
                            <div className="h-full w-full overflow-hidden p-1 flex flex-col gap-0.5" style={{ fontSize: '10px' }}>
                                <div className="flex items-center gap-1">
                                    {CategoryIcon && <CategoryIcon className="w-2.5 h-2.5 flex-none" />}
                                    <div className="font-bold leading-tight truncate">{arg.event.title}</div>
                                </div>
                                <div className="opacity-85 leading-tight">{arg.timeText}</div>
                                {arg.event.extendedProps.author && (
                                    <div className="opacity-70 truncate pt-1 flex-[1]">작성자: {arg.event.extendedProps.author}</div>
                                )}
                            </div>
                        );
                    }}
                    buttonText={{
                        today: '오늘',
                        month: '월',
                        week: '주',
                        day: '일'
                    }}
                />
            </div>

            {/* Event Action Popover */}
            {popoverEvent && (
                <div
                    className="fixed z-[100] bg-card rounded-xl shadow-2xl border p-2 flex flex-col gap-1 animate-in zoom-in-95 duration-200"
                    style={{
                        left: Math.min(popoverPos.x, window.innerWidth - 160),
                        top: Math.min(popoverPos.y, window.innerHeight - 100)
                    }}
                >
                    <div className="flex justify-between items-center px-2 py-1 border-b mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[100px]">{popoverEvent.title}</span>
                        <button onClick={() => setPopoverEvent(null)} className="p-0.5 hover:bg-muted rounded text-muted-foreground"><XIcon className="w-3 h-3" /></button>
                    </div>
                    <button
                        onClick={() => {
                            if (onShowLocation && popoverEvent.location) onShowLocation(popoverEvent.location);
                            setPopoverEvent(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-primary/10 text-primary rounded-lg transition-colors text-left"
                    >
                        <MapPinIcon className="w-3.5 h-3.5" /> 위치 표시
                    </button>
                    {popoverEvent.location && (
                        <a
                            href={popoverEvent.location.externalUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(popoverEvent.location.name + ' ' + (popoverEvent.location.address || ''))}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-muted text-foreground rounded-lg transition-colors text-left"
                            onClick={() => setPopoverEvent(null)}
                        >
                            <div className="w-3.5 h-3.5 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                                </svg>
                            </div>
                            구글 맵에서 열기
                        </a>
                    )}
                    <button
                        onClick={() => {
                            onEventClick(popoverEvent);
                            setPopoverEvent(null);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-muted rounded-lg transition-colors text-left"
                    >
                        <PencilIcon className="w-3.5 h-3.5" /> 일정 수정
                    </button>
                </div>
            )}
        </div>
    );
}
