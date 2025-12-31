'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Matter from 'matter-js';
import confetti from 'canvas-confetti';
import GameShell from '@/components/GameShell';
import { useGameStore } from '@/lib/store';
import { playSound } from '@/lib/sounds';
import { App } from '@capacitor/app';

// 과일 종류 (작은 것부터 큰 것 순서)
const FRUITS = [
    { name: '체리', emoji: '🍒', radius: 15, color: '#dc2626', score: 1 },
    { name: '딸기', emoji: '🍓', radius: 20, color: '#ef4444', score: 2 },
    { name: '포도', emoji: '🍇', radius: 25, color: '#8b5cf6', score: 3 },
    { name: '귤', emoji: '🍊', radius: 30, color: '#f97316', score: 5 },
    { name: '사과', emoji: '🍎', radius: 35, color: '#dc2626', score: 8 },
    { name: '배', emoji: '🍐', radius: 40, color: '#84cc16', score: 13 },
    { name: '복숭아', emoji: '🍑', radius: 45, color: '#fb923c', score: 21 },
    { name: '파인애플', emoji: '🍍', radius: 50, color: '#eab308', score: 34 },
    { name: '멜론', emoji: '🍈', radius: 55, color: '#22c55e', score: 55 },
    { name: '수박', emoji: '🍉', radius: 60, color: '#16a34a', score: 89 },
];

const GAME_WIDTH = 350;
const GAME_HEIGHT = 500;
const DROP_LINE_Y = 80;

export default function MergeFruit() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderIntervalRef = useRef<number | null>(null);
    const nextFruitRef = useRef(0);
    const dropXRef = useRef(GAME_WIDTH / 2);
    const canDropRef = useRef(true);

    const { settings, updateHighScore, addGameResult, highScores } = useGameStore();

    const [score, setScore] = useState(0);
    const [nextFruit, setNextFruit] = useState(0);
    const [dropX, setDropX] = useState(GAME_WIDTH / 2);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Matter.js 엔진 초기화
    const initEngine = useCallback(() => {
        const engine = Matter.Engine.create({
            gravity: { x: 0, y: 1 },
        });

        // 벽 생성
        const wallOptions = { isStatic: true, render: { fillStyle: '#4338ca' } };
        const walls = [
            // 바닥
            Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 25, GAME_WIDTH + 20, 50, wallOptions),
            // 왼쪽 벽
            Matter.Bodies.rectangle(-10, GAME_HEIGHT / 2, 20, GAME_HEIGHT, wallOptions),
            // 오른쪽 벽
            Matter.Bodies.rectangle(GAME_WIDTH + 10, GAME_HEIGHT / 2, 20, GAME_HEIGHT, wallOptions),
        ];

        Matter.Composite.add(engine.world, walls);

        // 충돌 이벤트
        Matter.Events.on(engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // 같은 과일끼리 충돌했는지 확인
                if (bodyA.label === bodyB.label && bodyA.label.startsWith('fruit-')) {
                    const fruitIndex = parseInt(bodyA.label.split('-')[1]);

                    if (fruitIndex < FRUITS.length - 1) {
                        const newFruitIndex = fruitIndex + 1;
                        const newFruit = FRUITS[newFruitIndex];

                        // 중간 위치에 새 과일 생성
                        const newX = (bodyA.position.x + bodyB.position.x) / 2;
                        const newY = (bodyA.position.y + bodyB.position.y) / 2;

                        // 기존 과일 제거
                        Matter.Composite.remove(engine.world, bodyA);
                        Matter.Composite.remove(engine.world, bodyB);

                        // 새 과일 생성
                        const newBody = Matter.Bodies.circle(newX, newY, newFruit.radius, {
                            restitution: 0.3,
                            friction: 0.5,
                            label: `fruit-${newFruitIndex}`,
                            render: { fillStyle: newFruit.color },
                        });
                        Matter.Composite.add(engine.world, newBody);

                        // 점수 추가
                        setScore((prev) => prev + newFruit.score);
                        playSound('merge', settings.soundEnabled);

                        // 수박 만들면 축하
                        if (newFruitIndex === FRUITS.length - 1) {
                            confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 },
                            });
                        }
                    }
                }
            });
        });

        engineRef.current = engine;
        return engine;
    }, [settings.soundEnabled]);

    // 렌더링
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const engine = engineRef.current;
        if (!canvas || !engine) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 배경
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // 드롭 라인
        ctx.strokeStyle = '#6366f1';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, DROP_LINE_Y);
        ctx.lineTo(GAME_WIDTH, DROP_LINE_Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // 다음 과일 미리보기
        const next = FRUITS[nextFruitRef.current];
        ctx.font = `${next.radius * 1.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(next.emoji, dropXRef.current, DROP_LINE_Y / 2);

        // 드롭 위치 표시
        ctx.strokeStyle = '#a5b4fc';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(dropXRef.current, DROP_LINE_Y);
        ctx.lineTo(dropXRef.current, GAME_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);

        // 과일들 그리기
        const bodies = Matter.Composite.allBodies(engine.world);

        bodies.forEach((body) => {
            if (body.label.startsWith('fruit-')) {
                const fruitIndex = parseInt(body.label.split('-')[1]);
                const fruit = FRUITS[fruitIndex];

                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);

                // 과일 원
                ctx.beginPath();
                ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
                ctx.fillStyle = fruit.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 이모지
                ctx.font = `${fruit.radius}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(fruit.emoji, 0, 0);

                ctx.restore();

                // 게임 오버 체크 (과일이 드롭 라인 위로 올라감)
                if (body.position.y - fruit.radius < DROP_LINE_Y && body.velocity.y < 0.1) {
                    // 잠시 후 게임 오버 (바로 종료하면 떨어지는 중에 종료될 수 있음)
                    setTimeout(() => {
                        if (body.position.y - fruit.radius < DROP_LINE_Y) {
                            handleGameOver();
                        }
                    }, 1000);
                }
            }
        });
    }, []);

    const handleGameOver = useCallback(() => {
        if (gameOver) return;

        setGameOver(true);
        updateHighScore('fruit', score);
        addGameResult({
            gameId: 'fruit',
            score,
            playedAt: new Date().toISOString(),
        });

        if (score > highScores.fruit) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
        playSound('success', settings.soundEnabled);
    }, [gameOver, score, updateHighScore, addGameResult, highScores.fruit, settings.soundEnabled]);

    // 과일 드롭
    const dropFruit = useCallback(() => {
        const engine = engineRef.current;
        if (!engine || !canDropRef.current) return;

        const fruit = FRUITS[nextFruitRef.current];
        const body = Matter.Bodies.circle(dropXRef.current, DROP_LINE_Y + fruit.radius, fruit.radius, {
            restitution: 0.3,
            friction: 0.5,
            label: `fruit-${nextFruitRef.current}`,
            render: { fillStyle: fruit.color },
        });

        Matter.Composite.add(engine.world, body);
        playSound('drop', settings.soundEnabled);

        // 다음 과일 결정 (0~3 범위의 작은 과일들 중 랜덤)
        const maxIndex = settings.difficulty === 'easy' ? 2 : settings.difficulty === 'normal' ? 3 : 4;
        const newNextFruit = Math.floor(Math.random() * maxIndex);
        nextFruitRef.current = newNextFruit;
        setNextFruit(newNextFruit);

        // 쿨다운
        canDropRef.current = false;
        setTimeout(() => {
            canDropRef.current = true;
        }, 500);
    }, [settings.soundEnabled, settings.difficulty]);

    // 게임 시작
    const startGame = useCallback(() => {
        if (engineRef.current) {
            Matter.Engine.clear(engineRef.current);
        }

        initEngine();
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        nextFruitRef.current = Math.floor(Math.random() * 3);
        setNextFruit(nextFruitRef.current);
        canDropRef.current = true;

        // 물리 엔진 실행
        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, engineRef.current!);

        // 렌더링 루프
        if (renderIntervalRef.current) {
            cancelAnimationFrame(renderIntervalRef.current);
        }

        const loop = () => {
            render();
            if (!gameOver) {
                renderIntervalRef.current = requestAnimationFrame(loop);
            }
        };
        loop();
    }, [initEngine, render, gameOver]);

    useEffect(() => {
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
            if (renderIntervalRef.current) {
                cancelAnimationFrame(renderIntervalRef.current);
            }
            if (engineRef.current) {
                Matter.Engine.clear(engineRef.current);
            }
        };
    }, [router]);

    // 터치/클릭 위치 업데이트
    const handleMove = (clientX: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const clampedX = Math.max(FRUITS[nextFruitRef.current].radius, Math.min(GAME_WIDTH - FRUITS[nextFruitRef.current].radius, x));
        dropXRef.current = clampedX;
        setDropX(clampedX);
    };

    const handleRestart = () => {
        startGame();
    };

    return (
        <GameShell
            title="Merge Fruit"
            score={score}
            onRestart={handleRestart}
            gameOver={gameOver}
            gameOverTitle="게임 오버!"
            gameOverMessage="과일이 넘쳤어요!"
            onGameOverClose={() => setGameOver(false)}
        >
            <div className="flex flex-col items-center gap-4">
                {!isPlaying ? (
                    <div className="flex flex-col items-center gap-6">
                        <div className="text-center text-white">
                            <h2 className="mb-2 text-2xl font-bold">🍉 Merge Fruit</h2>
                            <p className="text-lg opacity-80">같은 과일을 합쳐서 큰 과일을 만들어요!</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {FRUITS.slice(0, 5).map((fruit, i) => (
                                <div key={i} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
                                    {fruit.emoji}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={startGame}
                            className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 px-8 py-4 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                        >
                            게임 시작!
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 다음 과일 미리보기 */}
                        <div className="flex items-center gap-2 text-white">
                            <span>다음:</span>
                            <span className="text-3xl">{FRUITS[nextFruit].emoji}</span>
                        </div>

                        {/* 게임 캔버스 */}
                        <div className="overflow-hidden rounded-2xl border-4 border-indigo-400 shadow-2xl">
                            <canvas
                                ref={canvasRef}
                                width={GAME_WIDTH}
                                height={GAME_HEIGHT}
                                onMouseMove={(e) => handleMove(e.clientX)}
                                onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                                onClick={() => dropFruit()}
                                onTouchEnd={() => dropFruit()}
                                className="cursor-pointer"
                            />
                        </div>
                    </>
                )}
            </div>
        </GameShell>
    );
}
