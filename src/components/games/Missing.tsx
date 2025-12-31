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
    num1: number | '?';
    num2: number | '?';
    operator: '+' | '-';
    result: number | '?';
    answer: number;
    options: number[];
}

function generateProblem(difficulty: 'easy' | 'normal' | 'hard'): Problem {
    const maxNum = difficulty === 'easy' ? 10 : difficulty === 'normal' ? 20 : 50;
    const isAddition = Math.random() > 0.5;

    let num1: number, num2: number, result: number;

    if (isAddition) {
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * maxNum) + 1;
        result = num1 + num2;
    } else {
        result = Math.floor(Math.random() * maxNum) + 2;
        num1 = Math.floor(Math.random() * (result - 1)) + 1;
        num2 = result - num1;
    }

    // 빈칸 위치 결정 (num1, num2, result 중 하나)
    const missingPos = Math.floor(Math.random() * 3);
    let answer: number;
    let displayNum1: number | '?' = num1;
    let displayNum2: number | '?' = num2;
    let displayResult: number | '?' = result;

    if (missingPos === 0) {
        answer = num1;
        displayNum1 = '?';
    } else if (missingPos === 1) {
        answer = num2;
        displayNum2 = '?';
    } else {
        answer = result;
        displayResult = '?';
    }

    // 보기 생성
    const options = new Set<number>([answer]);
    while (options.size < 4) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const option = answer + offset;
        if (option > 0 && option !== answer) {
            options.add(option);
        }
    }

    return {
        num1: displayNum1,
        num2: displayNum2,
        operator: isAddition ? '+' : '-',
        result: displayResult,
        answer,
        options: Array.from(options).sort(() => Math.random() - 0.5),
    };
}

export default function Missing() {
    const router = useRouter();
    const { settings, updateHighScore, addGameResult, highScores } = useGameStore();

    const [problem, setProblem] = useState<Problem | null>(null);
    const [score, setScore] = useState(0);
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
            setScore((prev) => prev + 10);
            setFeedback('correct');
        } else {
            playSound('wrong', settings.soundEnabled);
            setFeedback('wrong');
        }

        setQuestionsAnswered((prev) => prev + 1);

        setTimeout(() => {
            if (questionsAnswered + 1 >= TOTAL_QUESTIONS) {
                const finalScore = isCorrect ? score + 10 : score;
                updateHighScore('missing', finalScore);
                addGameResult({
                    gameId: 'missing',
                    score: finalScore,
                    playedAt: new Date().toISOString(),
                });

                if (finalScore > highScores.missing) {
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
        setQuestionsAnswered(0);
        setGameOver(false);
        nextProblem();
    };

    if (!problem) return null;

    return (
        <GameShell
            title="Missing"
            score={score}
            onRestart={handleRestart}
            gameOver={gameOver}
            gameOverTitle="게임 종료!"
            gameOverMessage={`${TOTAL_QUESTIONS}문제 중 ${Math.floor(score / 10)}문제 정답!`}
            onGameOverClose={() => setGameOver(false)}
        >
            <div className="flex w-full max-w-lg flex-col items-center gap-6">
                {/* 진행 상황 */}
                <div className="w-full text-center text-lg text-white">
                    {questionsAnswered + 1} / {TOTAL_QUESTIONS}
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

                    <div className="flex items-center justify-center gap-4 text-center">
                        <span className={`text-5xl font-bold ${problem.num1 === '?' ? 'rounded-xl bg-yellow-300 px-4 py-2 text-yellow-800' : 'text-gray-800'}`}>
                            {problem.num1}
                        </span>
                        <span className="text-5xl font-bold text-gray-600">{problem.operator}</span>
                        <span className={`text-5xl font-bold ${problem.num2 === '?' ? 'rounded-xl bg-yellow-300 px-4 py-2 text-yellow-800' : 'text-gray-800'}`}>
                            {problem.num2}
                        </span>
                        <span className="text-5xl font-bold text-gray-600">=</span>
                        <span className={`text-5xl font-bold ${problem.result === '?' ? 'rounded-xl bg-yellow-300 px-4 py-2 text-yellow-800' : 'text-gray-800'}`}>
                            {problem.result}
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
