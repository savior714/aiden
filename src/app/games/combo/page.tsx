'use client';

import dynamic from 'next/dynamic';

const Combo = dynamic(() => import('@/components/games/Combo'), {
    ssr: false,
});

export default function ComboPage() {
    return <Combo />;
}
