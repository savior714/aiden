'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import GameShell from '@/components/GameShell';
import { useGameStore } from '@/lib/store';
import { playSound } from '@/lib/sounds';
import { App } from '@capacitor/app';

interface Block {
    id: string; // 고유 ID (애니메이션용)
    value: number;
    isRemoving?: boolean;
}

export default function Combo() {
    const router = useRouter();
    const { settings, updateHighScore, addGameResult, highScores } = useGameStore();

    // Game Configuration
    const GRID_SIZE = 8; // 8x8 Grid
    const TARGET_SUM = settings.difficulty === 'hard' ? 20 : 10;

    // Game State
    const [grid, setGrid] = useState<Block[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [comboChain, setComboChain] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false); // 애니메이션 중 입력 차단
    const [gameOver, setGameOver] = useState(false);

    // 랜덤 블록 생성
    const generateBlock = useCallback((): Block => {
        const maxNum = settings.difficulty === 'hard' ? 15 : 9;
        // 1부터 maxNum까지 랜덤 (단, TARGET_SUM보다 큰 수는 나오지 않게)
        const val = Math.floor(Math.random() * Math.min(maxNum, TARGET_SUM - 1)) + 1;
        return {
            id: Math.random().toString(36).substr(2, 9),
            value: val,
        };
    }, [settings.difficulty, TARGET_SUM]);

    // 초기 그리드 생성
    const initializeGrid = useCallback(() => {
        const newGrid = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => generateBlock());
        setGrid(newGrid);
        setSelectedIndices([]);
        setScore(0);
        setComboChain(0);
        setGameOver(false);
    }, [generateBlock, GRID_SIZE]);

    useEffect(() => {
        initializeGrid();

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
    }, [initializeGrid, router]);

    // 블록 선택 핸들러
    const handleBlockClick = (index: number) => {
        if (isProcessing || gameOver) return;

        if (selectedIndices.includes(index)) {
            // 이미 선택된 블록 클릭 시 선택 해제
            setSelectedIndices(prev => prev.filter(i => i !== index));
            return;
        }

        const newSelection = [...selectedIndices, index];
        const currentSum = newSelection.reduce((sum, idx) => sum + grid[idx].value, 0);

        if (currentSum === TARGET_SUM) {
            // 1. 정답! (합이 일치)
            handleMatch(newSelection);
        } else if (currentSum > TARGET_SUM) {
            // 2. 초과! (실패)
            playSound('wrong', settings.soundEnabled);
            setSelectedIndices([]);
            setComboChain(0); // 콤보 초기화
        } else {
            // 3. 아직 부족함 (계속 선택)
            setSelectedIndices(newSelection);
            playSound('click', settings.soundEnabled);
        }
    };

    // 매칭 성공 처리 (블록 삭제 및 채우기)
    const handleMatch = async (indicesToRemove: number[]) => {
        setIsProcessing(true);
        playSound('correct', settings.soundEnabled);

        // 콤보 보너스 계산
        const basePoints = indicesToRemove.length * 10;
        const comboBonus = comboChain * 5;
        const points = basePoints + comboBonus;
        setScore(s => s + points);
        setComboChain(c => c + 1);

        // 성공 이펙트
        if (comboChain >= 2) {
            confetti({
                particleCount: 50,
                spread: 40,
                origin: { y: 0.5 },
                colors: ['#FCD34D', '#F87171']
            });
        }

        // 1. 삭제 애니메이션 표시 (잠깐 대기)
        const newGrid = [...grid];
        indicesToRemove.forEach(idx => {
            newGrid[idx] = { ...newGrid[idx], isRemoving: true };
        });
        setGrid(newGrid);
        setSelectedIndices([]); // 선택 해제

        await new Promise(resolve => setTimeout(resolve, 300)); // 0.3초 대기

        // 2. 물리적 제거 및 중력 적용 (Gravity Logic)
        // 열(Column) 단위로 처리
        const finalGrid = new Array(GRID_SIZE * GRID_SIZE).fill(null);

        for (let col = 0; col < GRID_SIZE; col++) {
            // 현재 열에서 삭제되지 않은 블록들만 추출
            const remainingBlocks = [];
            for (let row = 0; row < GRID_SIZE; row++) {
                const index = row * GRID_SIZE + col;
                if (!indicesToRemove.includes(index)) {
                    remainingBlocks.push(grid[index]);
                }
            }

            // 위쪽 빈 공간만큼 새 블록 생성하여 채우기
            const needed = GRID_SIZE - remainingBlocks.length;
            const newBlocks = Array.from({ length: needed }, () => generateBlock());

            // [새 블록들, ...기존 블록들] 순서로 합쳐서 해당 열에 배치
            const mergedColumn = [...newBlocks, ...remainingBlocks];

            for (let row = 0; row < GRID_SIZE; row++) {
                finalGrid[row * GRID_SIZE + col] = mergedColumn[row];
            }
        }

        setGrid(finalGrid);
        setIsProcessing(false);

        // 최고 점수 갱신 체크
        if (score + points > highScores.combo) {
            updateHighScore('combo', score + points);
        }
    };

    const handleRestart = () => {
        initializeGrid();
    };

    const handleGameOver = () => {
        setGameOver(true);
        addGameResult({
            gameId: 'combo',
            score,
            playedAt: new Date().toISOString(),
        });

        if (score > highScores.combo) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
        playSound('success', settings.soundEnabled);
    };

    // 현재 선택된 합계 계산
    const currentSum = selectedIndices.reduce((sum, idx) => sum + (grid[idx]?.value || 0), 0);

    return (
        <GameShell
            title="Combo"
            score={score}
            onRestart={handleRestart}
            gameOver={gameOver}
            gameOverTitle="게임 종료!"
            gameOverMessage={`최종 점수: ${score}점!`}
            onGameOverClose={() => setGameOver(false)}
        >
            <div className="flex w-full max-w-2xl flex-col items-center gap-4">
                {/* 상태 표시 */}
                <div className="flex w-full items-center justify-between text-white">
                    <div className="flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2">
                        <span className="text-sm font-medium text-yellow-800">목표:</span>
                        <span className="text-xl font-bold text-yellow-900">{TARGET_SUM}</span>
                    </div>

                    <div className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${currentSum === TARGET_SUM ? 'bg-green-400 text-green-900 scale-110' :
                            currentSum > TARGET_SUM ? 'bg-red-400 text-red-900' :
                                'bg-white/80 text-gray-800'
                        }`}>
                        현재: {currentSum}
                    </div>

                    {comboChain > 0 && (
                        <div className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white animate-pulse">
                            🔥 콤보 x{comboChain}
                        </div>
                    )}
                </div>

                {/* 8x8 그리드 */}
                <div
                    className="grid w-full gap-1 rounded-2xl bg-purple-900/30 p-2 shadow-2xl backdrop-blur-sm"
                    style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
                >
                    {grid.map((block, index) => {
                        const isSelected = selectedIndices.includes(index);

                        return (
                            <button
                                key={`${block.id}-${index}`}
                                onClick={() => handleBlockClick(index)}
                                disabled={isProcessing || gameOver}
                                className={`
                  relative flex aspect-square items-center justify-center rounded-lg 
                  text-lg font-bold shadow-sm transition-all duration-200 select-none
                  ${isSelected
                                        ? 'bg-purple-500 text-white border-2 border-purple-300 scale-110 z-10 shadow-lg'
                                        : 'bg-white text-purple-600 border-b-2 border-purple-200 hover:brightness-95 active:translate-y-0.5'
                                    }
                  ${block.isRemoving ? 'scale-0 opacity-0 duration-300' : ''}
                  ${isProcessing || gameOver ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                            >
                                {block.value}
                            </button>
                        );
                    })}
                </div>

                {/* 안내 메시지 */}
                <div className="text-center text-sm text-white/80">
                    블록을 터치하여 합을 <span className="font-bold text-yellow-300">{TARGET_SUM}</span>으로 만드세요!
                    {comboChain > 0 && <div className="mt-1 text-orange-300">연속 성공 시 보너스 점수!</div>}
                </div>

                {/* 게임 종료 버튼 */}
                <button
                    onClick={handleGameOver}
                    className="mt-2 rounded-lg bg-white/20 px-4 py-2 text-sm text-white hover:bg-white/30 transition"
                >
                    게임 종료
                </button>
            </div>
        </GameShell>
    );
}
