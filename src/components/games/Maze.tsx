'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import GameShell from '@/components/GameShell';
import { useGameStore } from '@/lib/store';
import { playSound } from '@/lib/sounds';
import { App } from '@capacitor/app';

type Cell = {
    x: number;
    y: number;
    walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
    visited: boolean;
};

function generateMaze(width: number, height: number): Cell[][] {
    // 미로 초기화
    const maze: Cell[][] = [];
    for (let y = 0; y < height; y++) {
        maze[y] = [];
        for (let x = 0; x < width; x++) {
            maze[y][x] = {
                x,
                y,
                walls: { top: true, right: true, bottom: true, left: true },
                visited: false,
            };
        }
    }

    // DFS로 미로 생성
    const stack: Cell[] = [];
    const startCell = maze[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors: Cell[] = [];

        // 방문하지 않은 이웃 찾기
        const { x, y } = current;
        if (y > 0 && !maze[y - 1][x].visited) neighbors.push(maze[y - 1][x]);
        if (x < width - 1 && !maze[y][x + 1].visited) neighbors.push(maze[y][x + 1]);
        if (y < height - 1 && !maze[y + 1][x].visited) neighbors.push(maze[y + 1][x]);
        if (x > 0 && !maze[y][x - 1].visited) neighbors.push(maze[y][x - 1]);

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];

            // 벽 제거
            if (next.y < current.y) { current.walls.top = false; next.walls.bottom = false; }
            if (next.x > current.x) { current.walls.right = false; next.walls.left = false; }
            if (next.y > current.y) { current.walls.bottom = false; next.walls.top = false; }
            if (next.x < current.x) { current.walls.left = false; next.walls.right = false; }

            next.visited = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }

    return maze;
}

export default function Maze() {
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { settings, updateHighScore, addGameResult, highScores } = useGameStore();

    const [maze, setMaze] = useState<Cell[][] | null>(null);
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [moves, setMoves] = useState(0);

    const getMazeSize = useCallback(() => {
        const base = settings.difficulty === 'easy' ? 5 : settings.difficulty === 'normal' ? 7 : 10;
        return { width: base + level - 1, height: base + level - 1 };
    }, [settings.difficulty, level]);

    const CELL_SIZE = 40;

    const initMaze = useCallback(() => {
        const { width, height } = getMazeSize();
        const newMaze = generateMaze(width, height);
        setMaze(newMaze);
        setPlayerPos({ x: 0, y: 0 });
        setMoves(0);
    }, [getMazeSize]);

    useEffect(() => {
        initMaze();

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
    }, [initMaze, router]);

    // Canvas 그리기
    useEffect(() => {
        if (!maze || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = getMazeSize();
        canvas.width = width * CELL_SIZE;
        canvas.height = height * CELL_SIZE;

        // 배경
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 미로 그리기
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = maze[y][x];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                if (cell.walls.top) {
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + CELL_SIZE, py);
                    ctx.stroke();
                }
                if (cell.walls.right) {
                    ctx.beginPath();
                    ctx.moveTo(px + CELL_SIZE, py);
                    ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
                    ctx.stroke();
                }
                if (cell.walls.bottom) {
                    ctx.beginPath();
                    ctx.moveTo(px, py + CELL_SIZE);
                    ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE);
                    ctx.stroke();
                }
                if (cell.walls.left) {
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, py + CELL_SIZE);
                    ctx.stroke();
                }
            }
        }

        // 도착점 (별)
        ctx.fillStyle = '#fbbf24';
        ctx.font = `${CELL_SIZE * 0.7}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', (width - 0.5) * CELL_SIZE, (height - 0.5) * CELL_SIZE);

        // 플레이어
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(
            playerPos.x * CELL_SIZE + CELL_SIZE / 2,
            playerPos.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }, [maze, playerPos, getMazeSize]);

    const movePlayer = (dx: number, dy: number) => {
        if (!maze || gameOver) return;

        const { x, y } = playerPos;
        const cell = maze[y][x];

        // 벽 체크
        if (dx === -1 && cell.walls.left) return;
        if (dx === 1 && cell.walls.right) return;
        if (dy === -1 && cell.walls.top) return;
        if (dy === 1 && cell.walls.bottom) return;

        const newX = x + dx;
        const newY = y + dy;
        const { width, height } = getMazeSize();

        if (newX < 0 || newX >= width || newY < 0 || newY >= height) return;

        setPlayerPos({ x: newX, y: newY });
        setMoves((prev) => prev + 1);
        playSound('click', settings.soundEnabled);

        // 도착 체크
        if (newX === width - 1 && newY === height - 1) {
            playSound('success', settings.soundEnabled);
            const levelScore = Math.max(100 - moves * 2, 20) + level * 10;
            const newScore = score + levelScore;
            setScore(newScore);

            if (level >= 5) {
                updateHighScore('maze', newScore);
                addGameResult({
                    gameId: 'maze',
                    score: newScore,
                    playedAt: new Date().toISOString(),
                });

                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                });
                setGameOver(true);
            } else {
                setLevel((prev) => prev + 1);
            }
        }
    };

    // 키보드 이벤트
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': movePlayer(0, -1); break;
                case 'ArrowDown': case 's': case 'S': movePlayer(0, 1); break;
                case 'ArrowLeft': case 'a': case 'A': movePlayer(-1, 0); break;
                case 'ArrowRight': case 'd': case 'D': movePlayer(1, 0); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const handleRestart = () => {
        setScore(0);
        setLevel(1);
        setGameOver(false);
        initMaze();
    };

    // 터치/스와이프 감지
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;

        const minSwipe = 30;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > minSwipe) movePlayer(1, 0);
            else if (dx < -minSwipe) movePlayer(-1, 0);
        } else {
            if (dy > minSwipe) movePlayer(0, 1);
            else if (dy < -minSwipe) movePlayer(0, -1);
        }

        touchStartRef.current = null;
    };

    if (!maze) return null;

    return (
        <GameShell
            title="Maze"
            score={score}
            onRestart={handleRestart}
            gameOver={gameOver}
            gameOverTitle="클리어!"
            gameOverMessage={`5개 미로를 모두 탈출했어요!`}
            onGameOverClose={() => setGameOver(false)}
        >
            <div className="flex flex-col items-center gap-4">
                {/* 레벨 & 이동 횟수 */}
                <div className="flex gap-4 text-lg text-white">
                    <span>레벨 {level}/5</span>
                    <span>이동: {moves}</span>
                </div>

                {/* 미로 캔버스 */}
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <canvas
                        ref={canvasRef}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        className="rounded-xl"
                    />
                </div>

                {/* 방향 버튼 (터치용) */}
                <div className="grid grid-cols-3 gap-2">
                    <div />
                    <button
                        onClick={() => movePlayer(0, -1)}
                        className="h-14 w-14 rounded-xl bg-white/20 text-2xl text-white active:bg-white/30"
                    >
                        ↑
                    </button>
                    <div />
                    <button
                        onClick={() => movePlayer(-1, 0)}
                        className="h-14 w-14 rounded-xl bg-white/20 text-2xl text-white active:bg-white/30"
                    >
                        ←
                    </button>
                    <div />
                    <button
                        onClick={() => movePlayer(1, 0)}
                        className="h-14 w-14 rounded-xl bg-white/20 text-2xl text-white active:bg-white/30"
                    >
                        →
                    </button>
                    <div />
                    <button
                        onClick={() => movePlayer(0, 1)}
                        className="h-14 w-14 rounded-xl bg-white/20 text-2xl text-white active:bg-white/30"
                    >
                        ↓
                    </button>
                    <div />
                </div>
            </div>
        </GameShell>
    );
}
