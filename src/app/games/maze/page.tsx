'use client';

import dynamic from 'next/dynamic';

const Maze = dynamic(() => import('@/components/games/Maze'), {
    ssr: false,
});

export default function MazePage() {
    return <Maze />;
}
