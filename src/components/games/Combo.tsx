'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import GameShell from '@/components/GameShell';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store';
import { playSound } from '@/lib/sounds';
import { App } from '@capacitor/app';

interface Problem {
    numbers: number[];
    target: number;
    selected: number[];
}

function generateProblem(difficulty: 'easy' | 'normal' | 'hard'): Problem {
    const count = difficulty === 'easy' ? 4 : difficulty === 'normal' ? 5 : 6;
    const maxNum = difficulty === 'easy' ? 10 : difficulty === 'normal' ? 15 : 20;

    // 먼저 조합 가능한 숫자들 생성
    const numbers: number[] = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * maxNum) + 1);
    }

    // 목표 숫자 = 랜덤으로 선택된 숫자들의 합
    const selectCount = Math.min(2 + Math.floor(Math.random() * 2), numbers.length);
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    const target = shuffled.slice(0, selectCount).reduce((a, b) => a + b, 0);

    return {
        numbers: numbers.sort(() => Math.random() - 0.5),
        target,
        selected: [],
    };
}

export default function Combo() {
    const router = useRouter();
    const { settings, updateHighScore, addGameResult, highScores } = useGameStore();

    const [problem, setProblem] = useState<Problem | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const TOTAL_ROUNDS = 8;

    const nextProblem = useCallback(() => {
        setProblem(generateProblem(settings.difficulty));
        setSelected([]);
        setFeedback(null);
    }, [settings.difficulty]);

    useEffect(() => {
        nextProblem();

        const setupBackButton = async () => {
            try {
                await App.addListener('backButton', () => {
                    router.push('/');
                });
            } catch (error) {
                console.log('Capacitor App plugin not available');
            }
        };
        setupBackButton();

        return () => {
            App.removeAllListeners().catch(() => { });
        };
    }, [nextProblem, router]);

    const toggleNumber = (index: number) => {
        if (feedback) return;

        setSelected((prev) => {
            if (prev.includes(index)) {
                return prev.filter((i) => i !== index);
            }
            return [...prev, index];
        });
        playSound('click', settings.soundEnabled);
    };

    const checkAnswer = () => {
        if (!problem || selected.length === 0 || feedback) return;

        const sum = selected.reduce((acc, idx) => acc + problem.numbers[idx], 0);
        const isCorrect = sum === problem.target;

        if (isCorrect) {
            playSound('correct', settings.soundEnabled);
            setScore((prev) => prev + 10 + selected.length * 2);
            setFeedback('correct');
        } else {
            playSound('wrong', settings.soundEnabled);
            setFeedback('wrong');
        }

        setTimeout(() => {
            if (round >= TOTAL_ROUNDS) {
                const finalScore = isCorrect ? score + 10 + selected.length * 2 : score;
                updateHighScore('combo', finalScore);
                addGameResult({
                    gameId: 'combo',
                    score: finalScore,
                    playedAt: new Date().toISOString(),
                });

                if (finalScore > highScores.combo) {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                    });
                }
                playSound('success', settings.soundEnabled);
                setGameOver(true);
            } else {
                setRound((prev) => prev + 1);
                nextProblem();
            }
        }, 800);
    };

    const handleRestart = () => {
        setScore(0);
        setRound(1);
        setGameOver(false);
        nextProblem();
    };

    const currentSum = problem
        ? selected.reduce((acc, idx) => acc + problem.numbers[idx], 0)
        : 0;

    if (!problem) return null;

    return (
        <GameShell
            title="Combo"
            score={score}
            onRestart={handleRestart}
            gameOver={gameOver}
            gameOverTitle="게임 종료!"
            gameOverMessage={`${TOTAL_ROUNDS}라운드 완료!`}
            onGameOverClose={() => setGameOver(false)}
        >
            <div className="flex w-full max-w-lg flex-col items-center gap-6">
                {/* 라운드 & 목표 */}
                <div className="flex w-full items-center justify-between text-white">
                    <span className="text-lg">라운드 {round} / {TOTAL_ROUNDS}</span>
                </div>

                {/* 목표 숫자 */}
                <div className="rounded-2xl bg-yellow-400 px-8 py-4 shadow-lg">
                    <span className="text-lg text-yellow-800">목표: </span>
                    <span className="text-4xl font-bold text-yellow-900">{problem.target}</span>
                </div>

                {/* 현재 합계 */}
                <div className={`rounded-full px-6 py-2 text-xl font-bold ${currentSum === problem.target ? 'bg-green-400 text-green-900' :
                        currentSum > problem.target ? 'bg-red-400 text-red-900' :
                            'bg-white/80 text-gray-800'
                    }`}>
                    현재 합: {currentSum}
                </div>

                {/* 숫자 버튼들 */}
                <div className={`relative w-full rounded-3xl bg-white p-6 shadow-2xl transition-all ${feedback === 'correct' ? 'ring-4 ring-green-400' :
                        feedback === 'wrong' ? 'ring-4 ring-red-400' : ''
                    }`}>
                    {feedback && (
                        <div className={`absolute inset-0 flex items-center justify-center rounded-3xl text-6xl ${feedback === 'correct' ? 'bg-green-400/20' : 'bg-red-400/20'
                            }`}>
                            {feedback === 'correct' ? '⭕' : '❌'}
                        </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-3">
                        {problem.numbers.map((num, index) => (
                            <Button
                                key={index}
                                onClick={() => toggleNumber(index)}
                                disabled={feedback !== null}
                                className={`h-16 w-16 rounded-2xl text-2xl font-bold shadow-lg transition-all ${selected.includes(index)
                                        ? 'bg-purple-500 text-white scale-110'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                            >
                                {num}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* 확인 버튼 */}
                <Button
                    onClick={checkAnswer}
                    disabled={selected.length === 0 || feedback !== null}
                    className="h-16 w-full rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-2xl font-bold text-white shadow-lg hover:from-green-500 hover:to-emerald-600"
                >
                    확인! ✓
                </Button>
            </div>
        </GameShell>
    );
}
