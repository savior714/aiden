# AIDEN (Project Juwon)

아들 주원이를 위한 **광고 없는 청정 학습/게임 앱**

## 🎮 게임 목록

| 게임 | 설명 | 기술 |
|------|------|------|
| 🧮 **Math Test** | 사칙연산 퀴즈 | React, 난이도별 문제 생성 |
| ❓ **Missing** | 빈칸 채우기 (역연산) | React, 랜덤 빈칸 위치 |
| 🧩 **Combo** | 숫자 조합 퍼즐 | React, 다중 선택 |
| 🗺️ **Maze** | 미로 찾기 | HTML5 Canvas, DFS 알고리즘 |
| 🍒 **Merge Fruit** | 과일 합치기 | Matter.js 물리엔진 |

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router, Static Export)
- **Mobile**: Capacitor 6.0 (Android WebView)
- **UI**: TypeScript, Tailwind CSS, Shadcn/UI, Lucide React
- **Physics**: Matter.js (Merge Fruit)
- **State**: Zustand (점수 및 설정 관리)
- **Effects**: canvas-confetti, Howler.js

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 웹 빌드
npm run build

# Android APK 빌드
npm run build
npx cap sync android
npx cap open android
```

## 📱 Android 설정

- **가로 모드 고정**: `AndroidManifest.xml`에서 `screenOrientation="landscape"` 설정
- **뒤로가기 핸들링**: Capacitor App 플러그인으로 메인 메뉴 복귀
- **오프라인 우선**: 모든 리소스 로컬 포함

## 🎯 주요 기능

- ✅ 광고 없는 청정 환경
- ✅ 오프라인 동작
- ✅ 난이도 조절 (쉬움/보통/어려움)
- ✅ 점수 및 설정 영구 저장 (localStorage)
- ✅ 터치 최적화 (태블릿 친화적)
- ✅ 성공 시 축하 효과 (confetti)

## 📂 프로젝트 구조

```
aiden/
├── src/
│   ├── app/                    # Next.js 페이지
│   │   ├── page.tsx           # 메인 로비
│   │   └── games/             # 게임별 라우트
│   ├── components/
│   │   ├── GameShell.tsx      # 공통 게임 쉘
│   │   └── games/             # 게임별 컴포넌트
│   └── lib/
│       ├── store.ts           # Zustand 스토어
│       └── sounds.ts          # 사운드 관리
├── android/                    # Capacitor Android
├── next.config.mjs            # Static Export 설정
└── capacitor.config.ts        # Capacitor 설정
```

## 📝 라이선스

개인 프로젝트 (주원이 전용)
