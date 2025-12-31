--- START OF FILE AGENT.md용 마스터 프롬프트.md ---



🤖 Project Master Instruction (Standard v1.1)

이 문서는 프로젝트의 일관성을 유지하고, 제미나이(Gemini)가 코드 생성 및 프로젝트 관리를 수행할 때 준수해야 할 최상위 지침입니다.



🛠️ 1. 프로젝트 가변 설정 (Project Specifics)

이 섹션은 프로젝트의 성격에 따라 변경되는 기술 스택 및 환경 설정입니다.



핵심 목표: 아들 주원이를 위한 광고 없는 청정 학습/게임 앱 개발 (Android Tablet 타겟).



대상 게임(우선순위): 

1\. Math Test (사칙연산)

2\. Missing (빈칸 채우기)

3\. Combo (숫자 조합)

4\. Maze (미로 찾기)

5\. Merge Fruit (과일 합치기 - 물리엔진)



기술 스택:

Web: Next.js 14+ (App Router, Static Export)

Mobile: Capacitor (Android) - 웹앱을 APK로 변환

UI/UX: TypeScript, Tailwind CSS, Shadcn/UI, Lucide React

Physics(Game): Matter.js (Merge Fruit용), HTML5 Canvas

Automation: Playwright (Python/JS)

Environment: Node.js (npm), Android Studio (Build용)



운영 명령어:

개발: npm run dev

빌드(Web): npm run build (output: out/)

빌드(Android): npx cap sync android \&\& npx cap open android



특이사항:

오프라인 우선: 모든 자산은 로컬에 포함되어야 함 (외부 CDN 지양).

터치 최적화: 태블릿 환경을 고려하여 버튼 크기 및 터치 영역 확보.

Capacitor 설정: server: { androidScheme: 'https' } 설정 필수.



🏗️ 2. 개발 및 소통 원칙 (Core Principles - 공통)

모든 프로젝트에서 변하지 않는 기본 원칙입니다.



언어 및 인코딩: 모든 답변과 산출물은 한글로 작성하며, 한국어 문자는 반드시 UTF-8로 인코딩한다.



간결성(Conciseness): 불필요한 설명은 최소화하고 작업 결과와 핵심 로그 위주로 보고한다.



정직성(Honesty): 모르는 내용이나 에러 발생 시 추측하지 않고 솔직히 인정하며 대안을 제시한다.



문서 관리: 모든 Markdown 파일은 프로젝트 루트의 docs/ 폴더 안에 저장한다.



리팩토링(Tidying): 기존 기능을 깨뜨리지 않도록 아주 작은 단위부터 변화를 준다.



가시성: 모든 프로세스 진행 시 \*\*진행률(Progress Bar 또는 로그)\*\*을 표시하여 사용자에게 상태를 알린다.



🤖 3. 제미나이 최적화 및 코드 무결성 (Gemini Integrity - 공통)

생략 금지 (No Truncation): 코드를 수정할 때 // ... 또는 /\* 기존 코드 \*/와 같은 생략을 절대 하지 않는다. 파일 전체 내용을 제공하여 사용자가 바로 복사-붙여넣기 할 수 있게 한다.



사전 분석 (Chain of Thought): 코드를 작성하기 전, 수정 내용이 기존 기능에 미칠 영향을 먼저 한 문장으로 분석한 뒤 작성을 시작한다.



컨텍스트 보존: 새로운 기능 추가 시 기존의 import, 타입 정의, 환경 변수 설정을 임의로 삭제하거나 변경하지 않는다.



원자적 수정 (Atomic Modification): 한 번에 하나의 기능만 수정한다. 여러 파일 수정 시 순서를 제안하고 승인 후 진행한다.



비교 검토 (Diff Summary): 코드 작성 후, 기존 코드와의 차이점을 Diff 스타일로 짧게 요약하여 보고한다.



📦 4. Git Push Workflow (5단계 필수 절차 - 공통)

"git에 푸시해줘" 요청 시 다음 절차를 엄격히 준수한다.



변경사항 정리: git status 확인 후 논리적 단위로 스테이징. Conventional Commits 규칙 준수.



문서 업데이트: docs/AGENTS.md 또는 README.md에 변경 사항 반영 후 커밋.



Feature 브랜치 푸시: 현재 브랜치를 원격에 push.



Main 브랜치 병합: main으로 체크아웃 후 merge. 충돌 시 즉시 보고 및 해결책 제시.



최종 푸시: 병합된 main을 origin main에 push.

