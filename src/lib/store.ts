import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 앱 설정 인터페이스
export interface AppSettings {
    soundEnabled: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
}

// 게임 결과 인터페이스
export interface GameResult {
    gameId: 'math' | 'missing' | 'combo' | 'maze' | 'fruit';
    score: number;
    playedAt: string; // ISO Date
}

// 전체 스토어 상태 인터페이스
interface GameStore {
    // 설정
    settings: AppSettings;
    updateSettings: (settings: Partial<AppSettings>) => void;

    // 점수
    highScores: Record<GameResult['gameId'], number>;
    updateHighScore: (gameId: GameResult['gameId'], score: number) => void;

    // 최근 게임 기록
    recentGames: GameResult[];
    addGameResult: (result: GameResult) => void;
}

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            // 기본 설정
            settings: {
                soundEnabled: true,
                difficulty: 'normal',
            },

            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),

            // 최고 점수
            highScores: {
                math: 0,
                missing: 0,
                combo: 0,
                maze: 0,
                fruit: 0,
            },

            updateHighScore: (gameId, score) =>
                set((state) => {
                    if (score > state.highScores[gameId]) {
                        return {
                            highScores: { ...state.highScores, [gameId]: score },
                        };
                    }
                    return state;
                }),

            // 최근 게임 기록 (최대 10개)
            recentGames: [],

            addGameResult: (result) =>
                set((state) => {
                    const newRecentGames = [result, ...state.recentGames].slice(0, 10);
                    return { recentGames: newRecentGames };
                }),
        }),
        {
            name: 'aiden-game-storage',
        }
    )
);
