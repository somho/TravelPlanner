"use client";

import { useState, useEffect } from "react";
import { XIcon } from "lucide-react";
import { TravelEvent, Place, Category } from "@/types";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<TravelEvent, "id">, existingId?: string) => void;
    onDelete?: (id: string) => void;
    selectedDate: Date | null;
    existingEvent: TravelEvent | null;
    bookmarks: Place[];
    categories: Category[];
}

export default function EventModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    selectedDate,
    existingEvent,
    bookmarks,
    categories,
}: EventModalProps) {
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [details, setDetails] = useState("");
    const [author, setAuthor] = useState("");
    const [locationId, setLocationId] = useState("");
    const [category, setCategory] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (existingEvent) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setTitle(existingEvent.title);
                setStartTime(
                    existingEvent.start.toTimeString().slice(0, 5)
                );
                setEndTime(
                    existingEvent.end.toTimeString().slice(0, 5)
                );
                setDetails(existingEvent.details);
                setAuthor(existingEvent.author);
                setLocationId(existingEvent.location?.id || "");
                setCategory(existingEvent.category || "");
            } else {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setTitle("");
                
                let startStr = "09:00";
                let endStr = "10:00";

                if (selectedDate) {
                    const hours = selectedDate.getHours();
                    const minutes = selectedDate.getMinutes();
                    startStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    
                    const endDate = new Date(selectedDate);
                    endDate.setHours(hours + 1);
                    endStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
                }

                setStartTime(startStr);
                setEndTime(endStr);
                setDetails("");
                setAuthor("");
                setLocationId("");
                setCategory("");
            }
        }
    }, [isOpen, existingEvent]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate && !existingEvent) return;

        const baseDate = existingEvent ? existingEvent.start : selectedDate!;
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);

        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const day = baseDate.getDate();

        // This enforces exact local timezone building
        const start = new Date(year, month, day, startH, startM, 0, 0);
        const end = new Date(year, month, day, endH, endM, 0, 0);

        const selectedPlace = bookmarks.find((b) => b.id === locationId);

        onSave({
            title,
            category,
            start,
            end,
            details,
            author,
            location: selectedPlace,
        }, existingEvent?.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b flex items-center justify-between bg-muted/30">
                    <h2 className="text-lg font-bold">
                        {existingEvent ? "일정 수정" : "일정 추가"}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">제목</label>
                        <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 text-sm rounded-md border focus:ring-2 focus:ring-primary outline-none" placeholder="예: 센소지 방문" />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">시작 시간</label>
                            <input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 text-sm rounded-md border focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">종료 시간</label>
                            <input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 text-sm rounded-md border focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">카테고리</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-2 text-sm rounded-md border focus:ring-2 focus:ring-primary outline-none bg-background"
                        >
                            <option value="">-- 카테고리 선택 --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id} style={{ color: cat.color }}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">장소 (저장된 장소에서 선택)</label>
                        <select value={locationId} onChange={e => setLocationId(e.target.value)} className="w-full p-2 text-sm rounded-md border focus:ring-2 focus:ring-primary outline-none bg-background">
                            <option value="">-- 장소 선택 안함 --</option>
                            {bookmarks.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">상세 내용 / 메모</label>
                        <textarea value={details} onChange={e => setDetails(e.target.value)} className="w-full p-2 text-sm rounded-md border focus:ring-2 focus:ring-primary outline-none resize-none h-20" placeholder="메모 작성..." />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">작성자 이름</label>
                        <input required type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-2 text-sm rounded-md border focus:ring-2 focus:ring-primary outline-none" placeholder="이름 입력" />
                    </div>

                    <div className="mt-4 flex gap-3 pt-2">
                        {existingEvent && onDelete && (
                            <button
                                type="button"
                                onClick={() => { onDelete(existingEvent.id); onClose(); }}
                                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-semibold text-sm transition-colors"
                            >
                                삭제
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors"
                        >
                            일정 저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
