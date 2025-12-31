'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Home, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface GameShellProps {
    children: ReactNode;
    title: string;
    score?: number;
    onRestart?: () => void;
    showScore?: boolean;
    gameOver?: boolean;
    gameOverTitle?: string;
    gameOverMessage?: string;
    onGameOverClose?: () => void;
}

export default function GameShell({
    children,
    title,
    score = 0,
    onRestart,
    showScore = true,
    gameOver = false,
    gameOverTitle = '게임 종료!',
    gameOverMessage = '참 잘했어요! 🎉',
    onGameOverClose,
}: GameShellProps) {
    const router = useRouter();
    const { settings, updateSettings } = useGameStore();

    const handleHome = () => {
        router.push('/');
    };

    const toggleSound = () => {
        updateSettings({ soundEnabled: !settings.soundEnabled });
    };

    return (
        <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            {/* 상단 바 */}
            <header className="flex items-center justify-between bg-black/20 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleHome}
                        className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                    >
                        <Home className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-white drop-shadow-lg">{title}</h1>
                </div>

                <div className="flex items-center gap-2">
                    {showScore && (
                        <div className="rounded-full bg-yellow-400 px-4 py-2 text-lg font-bold text-yellow-900 shadow-lg">
                            ⭐ {score}
                        </div>
                    )}

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

                    {onRestart && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRestart}
                            className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                        >
                            <RotateCcw className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </header>

            {/* 게임 플레이 영역 */}
            <main className="flex flex-1 items-center justify-center p-4">
                {children}
            </main>

            {/* 게임 종료 모달 */}
            <Dialog open={gameOver} onOpenChange={onGameOverClose ? () => onGameOverClose() : undefined}>
                <DialogContent className="max-w-sm rounded-3xl border-4 border-yellow-400 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-center text-3xl font-bold">
                            {gameOverTitle}
                        </DialogTitle>
                        <DialogDescription className="text-center text-xl text-white/90">
                            {gameOverMessage}
                            {showScore && (
                                <div className="mt-4 text-4xl font-bold text-yellow-300">
                                    ⭐ {score}점
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-3 sm:justify-center">
                        <Button
                            onClick={handleHome}
                            className="h-14 flex-1 rounded-2xl bg-white/20 text-lg font-bold hover:bg-white/30"
                        >
                            <Home className="mr-2 h-5 w-5" />
                            홈으로
                        </Button>
                        {onRestart && (
                            <Button
                                onClick={() => {
                                    onGameOverClose?.();
                                    onRestart();
                                }}
                                className="h-14 flex-1 rounded-2xl bg-yellow-400 text-lg font-bold text-yellow-900 hover:bg-yellow-300"
                            >
                                <RotateCcw className="mr-2 h-5 w-5" />
                                다시하기
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
