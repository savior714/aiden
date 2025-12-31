'use client';

import dynamic from 'next/dynamic';

const MergeFruit = dynamic(() => import('@/components/games/MergeFruit'), {
    ssr: false,
});

export default function MergeFruitPage() {
    return <MergeFruit />;
}
