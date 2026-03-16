"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, MapPinIcon, GlobeIcon, Trash2Icon, PencilIcon, XIcon } from "lucide-react";
import { Place, Category } from "@/types";

interface BookmarkListProps {
    bookmarks: Place[];
    categories: Category[];
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, newName: string) => void;
    onSelect?: (id: string) => void;
}

export default function BookmarkList({ bookmarks, categories, searchTerm, onSearchChange, onDelete, onEdit, onSelect }: BookmarkListProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const handleCopy = (address: string, id: string) => {
        navigator.clipboard.writeText(address);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getCategory = (id?: string | null) => categories.find(c => c.id === id);

    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Search Input */}
            <div className="relative mb-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="장소 또는 메모 검색..."
                    className="w-full pl-9 pr-4 py-2 bg-muted/40 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                {bookmarks.length === 0 ? (
                    <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                        <p className="text-sm text-muted-foreground font-medium">
                            {searchTerm ? "검색 결과가 없습니다." : "아직 북마크가 없습니다."}
                        </p>
                    </div>
                ) : (
                    bookmarks.map((b) => {
                        const cat = getCategory(b.categoryId);
                        return (
                            <div
                                key={b.id}
                                className="p-3 rounded-lg border bg-card shadow-sm hover:border-primary/50 transition-colors flex flex-col gap-1.5 relative group cursor-pointer"
                                onClick={() => onSelect && onSelect(b.id)}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    {editingId === b.id ? (
                                        <div className="flex-1 flex gap-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="w-full text-sm font-semibold border-b bg-transparent outline-none"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && onEdit) {
                                                        onEdit(b.id, editName);
                                                        setEditingId(null);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingId(null);
                                                    }
                                                }}
                                            />
                                            <button onClick={() => {
                                                if (onEdit) onEdit(b.id, editName);
                                                setEditingId(null);
                                            }} className="text-green-500 hover:text-green-600"><CheckIcon className="w-4 h-4" /></button>
                                            <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><XIcon className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <h4 className="font-semibold text-sm leading-tight flex items-center gap-1 group/title">
                                            {b.name}
                                            {onEdit && (
                                                <button
                                                    onClick={() => { setEditingId(b.id); setEditName(b.name); }}
                                                    className="opacity-0 group-hover/title:opacity-100 p-0.5 text-muted-foreground hover:text-primary transition-opacity"
                                                >
                                                    <PencilIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                        </h4>
                                    )}
                                    <div className="flex gap-1 flex-none">
                                        {b.externalUrl && (
                                            <a href={b.externalUrl} target="_blank" rel="noreferrer" className="p-1 rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="구글 맵에서 열기">
                                                <GlobeIcon className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleCopy(b.address, b.id)}
                                            className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                            title="주소 복사"
                                        >
                                            {copiedId === b.id ? <CheckIcon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                        </button>
                                        {onDelete && (
                                            <button
                                                onClick={() => {
                                                    if (confirm("이 장소를 북마크에서 삭제하시겠습니까?")) {
                                                        onDelete(b.id);
                                                    }
                                                }}
                                                className="p-1 rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                                title="삭제"
                                            >
                                                <Trash2Icon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tags and Address */}
                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                    {cat && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow-sm whitespace-nowrap" style={{ backgroundColor: cat.color }}>
                                            {cat.name}
                                        </span>
                                    )}
                                    <p className="text-muted-foreground flex items-center gap-1 min-w-0">
                                        <MapPinIcon className="w-3 h-3 flex-none" />
                                        <span className="truncate">{b.address}</span>
                                    </p>
                                </div>
                            </div>
                        );
                    }))}
            </div>
        </div>
    );
}
