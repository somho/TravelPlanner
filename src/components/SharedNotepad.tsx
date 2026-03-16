"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2Icon, CheckCircle2Icon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface SharedNotepadProps {
    initialContent?: string;
}

export default function SharedNotepad({ initialContent = "" }: SharedNotepadProps) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // initialContent props가 변경될 때 컴포넌트에 반영합니다.
    useEffect(() => {
        // 사용자가 입력 중이 아닐 때만 외부 변경을 수신하여 덮어쓰는 것이 좋습니다.
        // 포커스 여부로 어느정도 방어합니다.
        if (document.activeElement !== textareaRef.current) {
            setContent(initialContent);
        }
    }, [initialContent]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        const { error } = await supabase.from('notepad').upsert({
            id: 'main',
            content: content,
            updatedAt: new Date().toISOString()
        }, { onConflict: 'id' });

        setIsSaving(false);
        
        if (!error) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } else {
            console.error("Notepad save error:", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="h-full flex flex-col pt-2">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full resize-none rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all custom-scrollbar"
                placeholder="여기에 공유할 메모를 작성하세요... (예: JR 패스 잊지마세요!)"
            />
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {isSaving ? (
                    <>
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                        저장 중...
                    </>
                ) : saveSuccess ? (
                    <>
                        <CheckCircle2Icon className="w-4 h-4" />
                        저장됨!
                    </>
                ) : (
                    "메모 저장"
                )}
            </button>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
                *실시간 서버 연동: 저장 시 접속한 모두의 화면에 반영됩니다.
            </p>
        </div>
    );
}
