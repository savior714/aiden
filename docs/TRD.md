--- START OF FILE TRD.md ---



\# \[Project Juwon] TRD (Technical Requirements Document)



\## 1. 기술 스택 (Tech Stack)

\* \*\*Framework:\*\* Next.js 14 (App Router) - `output: 'export'` 설정을 통해 정적 HTML/JS로 빌드.

\* \*\*Mobile Runtime:\*\* Capacitor 6.0 (Android) - 웹앱을 안드로이드 WebView 컨테이너로 래핑.

\* \*\*UI Library:\*\* 

&nbsp;   \* React

&nbsp;   \* Tailwind CSS (스타일링)

&nbsp;   \* Shadcn/UI (컴포넌트)

&nbsp;   \* Lucide React (아이콘)

\* \*\*Game/Physics Engine:\*\* 

&nbsp;   \* HTML5 Canvas API (Maze, General Drawing)

&nbsp;   \* Matter.js (Merge Fruit 물리 엔진)

&nbsp;   \* Howler.js (효과음 관리)

\* \*\*State Management:\*\* Zustand (가벼운 전역 상태 관리 - 점수, 설정 등)



\## 2. 시스템 아키텍처 (System Architecture)

\* \*\*구조:\*\* Monorepo 스타일 (프로젝트 루트에 웹과 모바일 설정 공존)

&nbsp;   \* `/app`: Next.js 페이지 라우팅

&nbsp;   \* `/components/games`: 각 게임별 격리된 로직 폴더

&nbsp;   \* `/android`: Capacitor가 생성한 안드로이드 네이티브 프로젝트

\* \*\*데이터 흐름:\*\*

&nbsp;   \* User Input (Touch) -> React State Update -> UI Re-render / Canvas Draw

&nbsp;   \* Data Persistence: `localStorage`를 사용하여 최고 점수 및 설정 저장 (DB 불필요).



\## 3. 상세 기능 설계 (Feature Implementation Detail)

\* \*\*공통 모듈 (GameShell):\*\*

&nbsp;   \* 상단: 홈 버튼, 점수판, 다시하기 버튼.

&nbsp;   \* 중앙: 게임 플레이 영역 (Canvas or DOM).

&nbsp;   \* 하단/모달: 게임 종료 팝업.

\* \*\*게임별 로직:\*\*

&nbsp;   \* \*\*Math Test / Missing:\*\* 랜덤 숫자 생성기 -> 정답 검증 로직 -> O/X 애니메이션 표시.

&nbsp;   \* \*\*Maze:\*\* DFS(깊이 우선 탐색) 알고리즘으로 미로 데이터(2차원 배열) 생성 -> Canvas에 그리기 -> 터치 좌표를 Grid 좌표로 변환하여 충돌 체크.

&nbsp;   \* \*\*Merge Fruit:\*\* Matter.js World 생성 -> 상단에서 과일 드롭 -> 충돌 시 `Body` 삭제 및 상위 단계 `Body` 생성 이벤트 처리.



\## 4. 데이터 모델링 (Data Modeling)

\* \*\*GameResult Interface:\*\*

```typescript

interface GameResult {

&nbsp; gameId: 'math' | 'missing' | 'combo' | 'maze' | 'fruit';

&nbsp; score: number;

&nbsp; playedAt: string; // ISO Date

}

