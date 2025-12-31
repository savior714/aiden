'use client';

import dynamic from 'next/dynamic';

// SSR 비활성화 (localStorage, Capacitor 사용을 위해)
const MathTest = dynamic(() => import('@/components/games/MathTest'), {
    ssr: false,
});

export default function MathPage() {
    return <MathTest />;
}
