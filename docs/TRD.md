## 1. 기술 스택 (Tech Stack)
* **Framework:** Next.js 14+ (App Router)
* **Mobile Engine:** Capacitor 6+ (Generic Android Integration)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, Shadcn/UI
* **Environment:** Node.js, Android Studio (SDK)

## 2. 시스템 아키텍처 (System Architecture)
* **컴포넌트 구조:**
    * `app/`: Next.js App Router 구조
    * `components/game/`: 게임 로직 및 UI 컴포넌트
    * `lib/`: 유틸리티 함수
* **데이터 흐름:**
    * Client-side Only (대부분의 게임 로직)
    * `localStorage` 또는 `IndexedDB`를 사용한 점수/진행상황 로컬 저장
* **배포 방식:**
    * Next.js Static Export (`output: 'export'`) -> Capacitor -> Android APK

## 3. 상세 기능 설계 (Feature Implementation Detail)
* **게임 엔진:**
    * React State 기반의 간단한 2D 게임 로직
    * 필요 시 HTML5 Canvas + `requestAnimationFrame` 사용
* **주요 게임 예시 (ToyTheater 참조):**
    * *예: 사칙연산 게임, 패턴 맞추기 등*
    * 각 게임은 독립된 컴포넌트 또는 페이지로 구현 (`/game/math-1`, `/game/puzzle-1`)

## 4. 데이터 모델링 (Data Modeling)
* **UserProgress Interface:**
    ```typescript
    interface GameResult {
      gameId: string;
      score: number;
      timestamp: number; // Date.now()
    }
    ```

## 5. 에러 처리 및 예외 케이스 (Error Handling & Edge Cases)
* **모바일 환경 대응:**
    * 터치 이벤트 처리 (Multi-touch 등)
    * 화면 회전 (Landscape/Portrait) 잠금 또는 대응
* **오프라인 모드:**
    * 인터넷 연결 없이도 게임 플레이 가능하도록 리소스 번들링

## 6. 필수 임포트 및 환경 설정 (Essential Imports & Config)
* **Dependencies:**
    * `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`
    * `lucide-react`, `clsx`, `tailwind-merge`