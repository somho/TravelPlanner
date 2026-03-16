"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, NotebookPenIcon, BookmarkIcon, MapPinIcon, MapIcon } from "lucide-react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Place, TravelEvent, Category } from "@/types";
import { v4 as uuidv4 } from 'uuid'; // 파일 상단에 추가

// [추가] DB 연동을 위한 가져오기
import { supabase } from "@/lib/supabaseClient";
import { useRealtimeTravelData } from "@/hooks/useRealtimeTravelData";

import MapSection from "@/components/MapSection";
import CalendarSection from "@/components/CalendarSection";
import BookmarkList from "@/components/BookmarkList";
import SharedNotepad from "@/components/SharedNotepad";
import EventModal from "@/components/EventModal";
import CategoryManager from "@/components/CategoryManager";

export default function Home() {
  // 1. [변경] 로컬 useState를 실시간 훅 데이터로 교체
  const { events, categories, bookmarks, notepadContent, tripSettings } = useRealtimeTravelData();

  // Modal & UI State (이런 UI 상태는 로컬로 유지합니다)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TravelEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeFocusId, setActiveFocusId] = useState<string | null>(null);
  const [bookmarkSearch, setBookmarkSearch] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. [변경] 데이터 조작 함수들을 DB 호출(supabase)로 변경
  // 실시간 훅이 DB 변화를 감지해 UI를 자동으로 업데이트하므로, 여기서는 setEvents 등을 직접 호출하지 않습니다.

  const handleAddBookmark = async (place: Place) => {
    const now = new Date().toISOString(); // [추가] 현재 시간을 ISO 문자열로 생성

    const { error } = await supabase.from('bookmarks').insert([{
      id: uuidv4(),
      customName: place.name,
      placeName: place.name,
      latitude: place.lat,
      longitude: place.lng,
      googleMapUrl: place.url || "",
      memo: "",
      categoryId: place.categoryId || null,
      createdAt: now, // [추가]
      updatedAt: now  // [추가] 에러가 났던 부분!
    }]);

    if (error) {
      console.error("상세 에러:", error.message);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
  };

  const handleEditBookmark = async (id: string, newName: string) => {
    await supabase.from('bookmarks').update({ customName: newName }).eq('id', id);
  };

  const handleSaveEvent = async (eventData: Omit<TravelEvent, "id">, existingId?: string) => {
    // Helper to format local Date without UTC conversion
    const toLocalISOString = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
    };

    const dbData: any = {
      title: eventData.title,
      description: eventData.details,
      startTime: toLocalISOString(eventData.start),
      endTime: toLocalISOString(eventData.end),
      authorName: eventData.author,
      categoryId: eventData.category || null,
      locationId: eventData.location?.id || null,
      locationName: eventData.location?.name || null,
      latitude: eventData.location?.lat || null,
      longitude: eventData.location?.lng || null
    };

    if (existingId) {
      dbData.updatedAt = new Date().toISOString();
      await supabase.from('events').update(dbData).eq('id', existingId);
    } else {
      const now = new Date().toISOString();
      dbData.id = uuidv4();
      dbData.createdAt = now;
      dbData.updatedAt = now;
      await supabase.from('events').insert([dbData]);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
  };

  const handleSaveSettings = async (startDate: Date | null, endDate: Date | null) => {
    await supabase.from('settings').upsert({
      id: 'main',
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      updatedAt: new Date().toISOString()
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: TravelEvent) => {
    setSelectedDate(event.start);
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // 필터링 로직은 기존과 동일하게 클라이언트에서 수행
  const filteredBookmarks = bookmarks.filter(b => {
    // b.name, b.customName, b.placeName 중 하나라도 존재하면 쓰고, 없으면 빈 문자열("") 취급
    const targetName = (b.name || b.customName || b.placeName || "").toLowerCase();
    const search = (bookmarkSearch || "").toLowerCase();

    return targetName.includes(search);
  });

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="flex-none h-16 border-b bg-card flex items-center px-6 justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
            🇯🇵
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">후쿠오카 여행 플래너</h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">실시간 협업 중</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.google.co.kr/maps/@33.5809908,130.4160382,12z?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-semibold transition-all shadow-sm border border-primary/20"
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden xs:inline">구글 지도 열기</span>
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-2 md:p-4 lg:p-6 flex flex-col h-full">
        <PanelGroup
          orientation={(isMobile ? "vertical" : "horizontal") as "vertical" | "horizontal"}
          className="h-full w-full rounded-2xl border shadow-sm overflow-hidden bg-card"
        >
          <Panel defaultSize={50} minSize={30} className="relative h-full">
            <MapSection
              onAddBookmark={handleAddBookmark}
              categories={categories}
              bookmarks={filteredBookmarks}
              events={events}
              activeFocusId={activeFocusId}
              onFocusCleared={() => setActiveFocusId(null)}
            />
          </Panel>

          <PanelResizeHandle className="w-full h-3 md:w-2 md:h-full bg-muted/50 hover:bg-primary/50 cursor-row-resize md:cursor-col-resize transition-colors flex items-center justify-center relative">
            <div className="w-8 h-1 md:w-1 md:h-8 bg-border rounded-full absolute" />
          </PanelResizeHandle>

          <Panel defaultSize={50} minSize={30} className="h-full overflow-y-auto pr-2 custom-scrollbar bg-card flex flex-col">
            <div className="p-4 flex flex-col gap-6 w-full pb-10">

              <div className="bg-card flex flex-col rounded-2xl shadow-sm border overflow-hidden min-h-[500px]">
                <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-sm">일정표</h2>
                </div>
                <div className="p-4 flex-1 h-full overflow-hidden">
                  <CalendarSection
                    events={events}
                    categories={categories}
                    tripSettings={tripSettings}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                    onSaveSettings={handleSaveSettings}
                    onShowLocation={(place) => setActiveFocusId(place.id)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-card flex flex-col rounded-2xl shadow-sm border overflow-hidden">
                  <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
                    <BookmarkIcon className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-sm">카테고리 관리</h2>
                  </div>
                  <div className="p-4 flex-1">
                    {/* [변경] 카테고리 관리도 DB 기반으로 동작하도록 수정 필요 */}
                    <CategoryManager categories={categories} />
                  </div>
                </div>

                <div className="bg-card flex flex-col rounded-2xl shadow-sm border overflow-hidden min-h-[250px] xl:row-span-2">
                  <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
                    <NotebookPenIcon className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-sm">공용 메모장</h2>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    {/* [변경] 초기 값전달 */}
                    <SharedNotepad initialContent={notepadContent} />
                  </div>
                </div>

                <div className="bg-card flex flex-col rounded-2xl shadow-sm border overflow-hidden min-h-[300px]">
                  <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-sm">저장된 장소</h2>
                  </div>
                  <div className="p-2 flex-1 flex flex-col gap-2">
                    <BookmarkList
                      bookmarks={filteredBookmarks}
                      categories={categories}
                      searchTerm={bookmarkSearch}
                      onSearchChange={setBookmarkSearch}
                      onDelete={handleDeleteBookmark}
                      onEdit={handleEditBookmark}
                      onSelect={(id) => setActiveFocusId(id)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </main>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        existingEvent={selectedEvent}
        bookmarks={bookmarks}
        categories={categories}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}