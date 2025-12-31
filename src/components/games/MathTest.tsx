'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import GameShell from '@/components/GameShell';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store';
import { playSound } from '@/lib/sounds';
import { App } from '@capacitor/app';

type Operator = '+' | '-' | '×' | '÷';

interface Problem {
    num1: number;
    num2: number;
    operator: Operator;
    answer: number;
    options: number[];
}

function generateProblem(difficulty: 'easy' | 'normal' | 'hard'): Problem {
    const operators: Operator[] =
        difficulty === 'easy' ? ['+', '-'] :
            difficulty === 'normal' ? ['+', '-', '×'] :
                ['+', '-', '×', '÷'];

    const maxNum = difficulty === 'easy' ? 10 : difficulty === 'normal' ? 20 : 50;

    const operator = operators[Math.floor(Math.random() * operators.length)];

    let num1: number, num2: number, answer: number;

    switch (operator) {
        case '+':
            num1 = Math.floor(Math.random() * maxNum) + 1;
            num2 = Math.floor(Math.random() * maxNum) + 1;
            answer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * maxNum) + 1;
            num2 = Math.floor(Math.random() * num1) + 1;
            answer = num1 - num2;
            break;
        case '×':
            num1 = Math.floor(Math.random() * (difficulty === 'hard' ? 12 : 9)) + 1;
            num2 = Math.floor(Math.random() * 9) + 1;
            answer = num1 * num2;
            break;
        case '÷':
            num2 = Math.floor(Math.random() * 9) + 1;
            answer = Math.floor(Math.random() * 9) + 1;
            num1 = num2 * answer;
            break;
        default:
            num1 = 1; num2 = 1; answer = 2;
    }

    // 보기 생성 (정답 포함 4개)
    const options = new Set<number>([answer]);
    while (options.size < 4) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const option = answer + offset;
        if (option > 0 && option !== answer) {
            options.add(option);
        }
    }

    return {
        num1,
        num2,
        operator,
        answer,
        options: Array.from(options).sort(() => Math.random() - 0.5),
    };
}

export default function MathTest() {
    const router = useRouter();
    const { settings, updateHighScore, addGameResult, highScores } = useGameStore();

    const [problem, setProblem] = useState<Problem | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const TOTAL_QUESTIONS = 10;

    const nextProblem = useCallback(() => {
        setProblem(generateProblem(settings.difficulty));
        setFeedback(null);
    }, [settings.difficulty]);

    useEffect(() => {
        nextProblem();

        // Android 뒤로가기 핸들링
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

    const handleAnswer = (selected: number) => {
        if (!problem || feedback) return;

        const isCorrect = selected === problem.answer;

        if (isCorrect) {
            playSound('correct', settings.soundEnabled);
            const bonus = streak >= 3 ? 2 : 1;
            setScore((prev) => prev + (10 * bonus));
            setStreak((prev) => prev + 1);
            setFeedback('correct');
        } else {
            playSound('wrong', settings.soundEnabled);
            setStreak(0);
            setFeedback('wrong');
        }

        setQuestionsAnswered((prev) => prev + 1);

        setTimeout(() => {
            if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
                // 게임 종료
                const finalScore = isCorrect ? score + (streak >= 3 ? 20 : 10) : score;
                updateHighScore('math', finalScore);
                addGameResult({
                    gameId: 'math',
                    score: finalScore,
                    playedAt: new Date().toISOString(),
                });

                if (finalScore > highScores.math) {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                    });
                }
                playSound('success', settings.soundEnabled);
                setGameOver(true);
            } else {
                nextProblem();
            }
        }, 800);
    };

    const handleRestart = () => {
        setScore(0);
        setStreak(0);
        setQuestionsAnswered(0);
        setGameOver(false);
        nextProblem();
    };

    if (!problem) return null;

    return (
        <GameShell
            title="Math Test"
            score={score}
            onRestart={handleRestart}
            gameOver={gameOver}
            gameOverTitle="게임 종료!"
            gameOverMessage={`${TOTAL_QUESTIONS}문제 중 ${Math.floor(score / 10)}문제 정답!`}
            onGameOverClose={() => setGameOver(false)}
        >
            <div className="flex w-full max-w-lg flex-col items-center gap-6">
                {/* 진행 상황 */}
                <div className="flex w-full items-center justify-between text-white">
                    <span className="text-lg">
                        {questionsAnswered + 1} / {TOTAL_QUESTIONS}
                    </span>
                    {streak >= 3 && (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold animate-pulse">
                            🔥 콤보 x{streak}!
                        </span>
                    )}
                </div>

                {/* 문제 카드 */}
                <div className={`relative w-full rounded-3xl bg-white p-8 shadow-2xl transition-all ${feedback === 'correct' ? 'ring-4 ring-green-400' :
                        feedback === 'wrong' ? 'ring-4 ring-red-400' : ''
                    }`}>
                    {feedback && (
                        <div className={`absolute inset-0 flex items-center justify-center rounded-3xl text-6xl ${feedback === 'correct' ? 'bg-green-400/20' : 'bg-red-400/20'
                            }`}>
                            {feedback === 'correct' ? '⭕' : '❌'}
                        </div>
                    )}

                    <div className="text-center">
                        <span className="text-5xl font-bold text-gray-800">
                            {problem.num1} {problem.operator} {problem.num2} = ?
                        </span>
                    </div>
                </div>

                {/* 보기 버튼 */}
                <div className="grid w-full grid-cols-2 gap-4">
                    {problem.options.map((option, index) => (
                        <Button
                            key={index}
                            onClick={() => handleAnswer(option)}
                            disabled={feedback !== null}
                            className="h-20 rounded-2xl text-3xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 bg-white text-gray-800 hover:bg-gray-100"
                        >
                            {option}
                        </Button>
                    ))}
                </div>
            </div>
        </GameShell>
    );
}
