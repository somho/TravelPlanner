# ✈️ Travel Planner (여행 플래너)

**Travel Planner**는 여행 일정을 체계적으로 계획하고 관리할 수 있도록 도와주는 모던 웹 애플리케이션입니다. 
Google Maps를 활용하여 장소를 검색 및 저장하고, 캘린더를 통해 직관적으로 일정을 정리할 수 있습니다. 
Supabase를 통한 실시간 데이터 동기화로 여러 디바이스에서도 매끄러운 사용 경험을 제공합니다.

## ✨ 주요 기능 (Features)

* **🗺️ 인터랙티브 지도 (Google Maps 연동)**
  * 원하는 장소를 검색하고 저장
  * 저장된 장소를 클릭하여 구글 맵 외부 링크로 바로 이동 (장소 상세 정보 확인)
* **📅 직관적인 캘린더 일정 관리**
  * FullCalendar를 활용한 Drag & Drop 방식의 편리한 캘린더
  * 같은 시간대에 최대 3개의 일정을 효율적으로 관리
* **📌 장소 및 카테고리 관리 (Bookmarks & Categories)**
  * 저장된 장소들에 대한 개인 메모(Memo) 작성 기능
  * 중요하거나 자주 찾는 장소를 최상단에 고정(Pin)하는 기능
  * 목적에 맞게 장소를 분류할 수 있는 카테고리 생성, 삭제 및 순서 변경(Reordering) 기능
* **💻 다이내믹 UI 및 모바일 최적화**
  * Calendar, Categories, Bookmarks, Notepad 각 섹션을 자유롭게 토글(Hide/Show)
  * Resizable Panels를 통한 자유로운 화면 분할 비율 조절
  * 모바일 환경에 최적화된 부드럽고 자연스러운 스크롤(Mobile Scroll Optimization) 경험 제공
* **⚡ 실시간 데이터 동기화**
  * Supabase 리얼타임 구독(Real-time Subscription)을 이용한 즉각적인 상태 반영

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
* **Framework:** [Next.js](https://nextjs.org/) (App Router, v16)
* **Library:** [React](https://react.dev/) (v19)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
* **Map:** [@react-google-maps/api](https://react-google-maps-api-docs.netlify.app/)
* **Calendar:** [FullCalendar](https://fullcalendar.io/) (@fullcalendar/react)
* **Components:** [react-resizable-panels](https://react-resizable-panels.vercel.app/), [Lucide React](https://lucide.dev/) (Icons)

### Backend & Database
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL & Realtime)
* **ORM:** [Prisma](https://www.prisma.io/)

## 🚀 시작하기 (Getting Started)

프로젝트를 로컬 환경에서 실행하기 위한 방법입니다.

### 요구 사항
* Node.js 버전을 설치해주세요. (권장: v20 이상)
* Supabase 계정과 프로젝트 설정이 필요합니다.
* Google Cloud Console에서 Google Maps API 키 발급이 필요합니다.

### 1. 저장소 클론 (Clone the repository)

```bash
git clone https://github.com/사용자명/레포지토리명.git
cd travel
```

### 2. 패키지 설치 (Install dependencies)

```bash
npm install
```

### 3. 환경 변수 설정 (Environment variables)

루트 디렉토리에 `.env.local` (또는 `.env`) 파일을 생성하고 다음 변수들을 설정해주세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_prisma_connection_string

# Google Maps API 설정
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Prisma 데이터베이스 동기화

```bash
npx prisma generate
npx prisma db push
```

### 5. 개발 서버 실행 (Run development server)

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션을 확인합니다.

## 🤝 기여 (Contributing)
기여를 원하신다면 언제든 Pull Request를 환영합니다! 버그 리포트나 기능 제안은 Issue를 통해 남겨주세요.
