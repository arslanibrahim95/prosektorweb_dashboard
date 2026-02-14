'use client';

import { useEffect } from 'react';

export function DesignSystemLoadLog() {
    useEffect(() => {
        console.log('Design system loaded');
    }, []);

    return null;
}
