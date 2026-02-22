'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function DesignSystemLoadLog() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            logger.info('Design system loaded');
        }
    }, []);

    return null;
}
