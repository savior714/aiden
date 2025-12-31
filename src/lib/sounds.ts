import { Howl } from 'howler';

// 사운드 캐시
const soundCache: Record<string, Howl> = {};

// 사운드 파일 경로 (로컬 에셋)
const SOUND_PATHS = {
    correct: '/sounds/correct.mp3',
    wrong: '/sounds/wrong.mp3',
    click: '/sounds/click.mp3',
    success: '/sounds/success.mp3',
    drop: '/sounds/drop.mp3',
    merge: '/sounds/merge.mp3',
} as const;

type SoundName = keyof typeof SOUND_PATHS;

// 사운드 로드
function getSound(name: SoundName): Howl {
    if (!soundCache[name]) {
        soundCache[name] = new Howl({
            src: [SOUND_PATHS[name]],
            volume: 0.5,
            preload: true,
        });
    }
    return soundCache[name];
}

// 사운드 재생
export function playSound(name: SoundName, enabled: boolean = true): void {
    if (!enabled) return;

    try {
        const sound = getSound(name);
        sound.play();
    } catch (error) {
        console.warn(`사운드 재생 실패: ${name}`, error);
    }
}

// 모든 사운드 미리 로드
export function preloadSounds(): void {
    Object.keys(SOUND_PATHS).forEach((name) => {
        getSound(name as SoundName);
    });
}

// 볼륨 설정
export function setVolume(volume: number): void {
    Howler.volume(volume);
}

// 모든 사운드 정지
export function stopAllSounds(): void {
    Howler.stop();
}
