'use client';

import { useEffect } from 'react';

export function DesignSystemLoadLog() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Design system loaded');
        }
    }, []);

    return null;
}
