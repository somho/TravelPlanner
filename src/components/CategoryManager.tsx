"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { Category } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from 'uuid';

interface CategoryManagerProps {
    categories: Category[];
}

export default function CategoryManager({ categories }: CategoryManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");

    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState("#000000");

    const [draggedId, setDraggedId] = useState<string | null>(null);

    const handleDragStart = (id: string) => setDraggedId(id);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = async (targetId: string) => {
        if (!draggedId || draggedId === targetId) return;

        const oldIndex = categories.findIndex(c => c.id === draggedId);
        const newIndex = categories.findIndex(c => c.id === targetId);
        if (oldIndex === -1 || newIndex === -1) return;

        const newCategories = [...categories];
        const [removed] = newCategories.splice(oldIndex, 1);
        newCategories.splice(newIndex, 0, removed);

        setDraggedId(null);

        // Update sort order for all affected categories
        await Promise.all(newCategories.map((cat, index) => 
            supabase.from('categories').update({ sortOrder: index }).eq('id', cat.id)
        ));
    };

    const handleEditClick = (c: Category) => {
        setEditingId(c.id);
        setEditName(c.name);
        setEditColor(c.color);
        setIsAdding(false);
    };

    const handleSaveEdit = async () => {
        await supabase.from('categories').update({
            name: editName,
            color: editColor,
            updatedAt: new Date().toISOString()
        }).eq('id', editingId);
        
        setEditingId(null);
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        const now = new Date().toISOString();
        
        await supabase.from('categories').insert([{
            id: uuidv4(),
            name: newName,
            color: newColor,
            sortOrder: categories.length,
            createdAt: now,
            updatedAt: now
        }]);

        setIsAdding(false);
        setNewName("");
        setNewColor("#000000");
    };

    const handleDelete = async (id: string) => {
        if (confirm("이 카테고리를 삭제하시겠습니까? (연결된 정보에서 카테고리가 사라질 수 있습니다)")) {
            await supabase.from('categories').delete().eq('id', id);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {/* List */}
            <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                    <div 
                        key={c.id} 
                        draggable={editingId !== c.id}
                        onDragStart={() => handleDragStart(c.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(c.id)}
                        className={`relative group border rounded-full px-3 py-1 flex items-center gap-2 bg-background shadow-sm text-sm ${editingId !== c.id ? "cursor-grab active:cursor-grabbing" : ""} ${draggedId === c.id ? "opacity-50" : ""}`}
                    >
                        {editingId === c.id ? (
                            <div className="flex items-center gap-2">
                                <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-20 outline-none text-sm bg-transparent border-b" autoFocus />
                                <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-600"><CheckIcon className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground"><XIcon className="w-3.5 h-3.5" /></button>
                            </div>
                        ) : (
                            <>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                                <span>{c.name}</span>
                                <div className="hidden group-hover:flex items-center gap-1 ml-1 bg-background/80 rounded px-1 absolute right-2">
                                    <button onClick={() => handleEditClick(c)} className="text-muted-foreground hover:text-primary"><PencilIcon className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-red-500"><Trash2Icon className="w-3.5 h-3.5" /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {!isAdding && (
                    <button onClick={() => { setIsAdding(true); setEditingId(null); }} className="border border-dashed rounded-full px-3 py-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                        <PlusIcon className="w-3.5 h-3.5" /> 추가
                    </button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="flex items-center gap-2 mt-2 p-2 border rounded-lg bg-muted/50">
                    <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="카테고리 이름" className="flex-1 outline-none text-sm bg-background border px-2 py-1 rounded" autoFocus />
                    <button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-semibold">저장</button>
                    <button onClick={() => setIsAdding(false)} className="text-muted-foreground hover:text-foreground border px-2 py-1 rounded text-xs">취소</button>
                </div>
            )}
        </div>
    );
}
