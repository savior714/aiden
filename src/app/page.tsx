'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Calculator,
  HelpCircle,
  Puzzle,
  Map,
  Cherry,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store';
import { App } from '@capacitor/app';

const games = [
  {
    id: 'math',
    title: 'Math Test',
    subtitle: '사칙연산',
    icon: Calculator,
    color: 'from-blue-400 to-blue-600',
    href: '/games/math',
  },
  {
    id: 'missing',
    title: 'Missing',
    subtitle: '빈칸 채우기',
    icon: HelpCircle,
    color: 'from-green-400 to-green-600',
    href: '/games/missing',
  },
  {
    id: 'combo',
    title: 'Combo',
    subtitle: '숫자 조합',
    icon: Puzzle,
    color: 'from-orange-400 to-orange-600',
    href: '/games/combo',
  },
  {
    id: 'maze',
    title: 'Maze',
    subtitle: '미로 찾기',
    icon: Map,
    color: 'from-purple-400 to-purple-600',
    href: '/games/maze',
  },
  {
    id: 'fruit',
    title: 'Merge Fruit',
    subtitle: '과일 합치기',
    icon: Cherry,
    color: 'from-pink-400 to-pink-600',
    href: '/games/merge-fruit',
  },
];

export default function Home() {
  const { settings, updateSettings, highScores } = useGameStore();

  // Android 뒤로가기 버튼 핸들링 (메인에서는 앱 종료 확인)
  useEffect(() => {
    const setupBackButton = async () => {
      try {
        await App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            // 메인 화면에서 뒤로가기 시 아무 동작 안함 (앱 종료 방지)
            // 필요시 종료 확인 다이얼로그 추가 가능
          }
        });
      } catch (error) {
        // 웹 브라우저에서는 Capacitor App 플러그인이 없으므로 무시
        console.log('Capacitor App plugin not available');
      }
    };

    setupBackButton();

    return () => {
      App.removeAllListeners().catch(() => { });
    };
  }, []);

  const toggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      {/* 헤더 */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm">
            🎮
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">AIDEN</h1>
            <p className="text-sm text-white/80">주원이의 학습 놀이터</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSound}
          className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          {settings.soundEnabled ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <VolumeX className="h-6 w-6" />
          )}
        </Button>
      </header>

      {/* 게임 그리드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {games.map((game) => {
          const Icon = game.icon;
          const highScore = highScores[game.id as keyof typeof highScores] || 0;

          return (
            <Link key={game.id} href={game.href}>
              <Card className="group relative overflow-hidden rounded-3xl border-4 border-white/30 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/20 active:scale-95">
                {/* 아이콘 */}
                <div className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${game.color} shadow-lg transition-transform group-hover:rotate-3`}>
                  <Icon className="h-10 w-10 text-white" />
                </div>

                {/* 제목 */}
                <h2 className="text-center text-lg font-bold text-white drop-shadow">
                  {game.title}
                </h2>
                <p className="text-center text-sm text-white/80">{game.subtitle}</p>

                {/* 최고 점수 */}
                {highScore > 0 && (
                  <div className="mt-2 rounded-full bg-yellow-400/80 px-3 py-1 text-center text-sm font-bold text-yellow-900">
                    ⭐ {highScore}
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 하단 설정 */}
      <footer className="mt-8 text-center">
        <p className="text-sm text-white/60">
          난이도: {settings.difficulty === 'easy' ? '쉬움' : settings.difficulty === 'normal' ? '보통' : '어려움'}
        </p>
        <div className="mt-2 flex justify-center gap-2">
          {(['easy', 'normal', 'hard'] as const).map((diff) => (
            <Button
              key={diff}
              variant={settings.difficulty === diff ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateSettings({ difficulty: diff })}
              className={`rounded-full ${settings.difficulty === diff
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              {diff === 'easy' ? '쉬움' : diff === 'normal' ? '보통' : '어려움'}
            </Button>
          ))}
        </div>
      </footer>
    </div>
  );
}
