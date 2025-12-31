'use client';

import dynamic from 'next/dynamic';

const Missing = dynamic(() => import('@/components/games/Missing'), {
    ssr: false,
});

export default function MissingPage() {
    return <Missing />;
}
