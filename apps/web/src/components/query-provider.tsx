'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-handler';

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30 * 1000, // 30 seconds
                retry: (failureCount, error) => {
                    const status =
                        typeof error === 'object' &&
                            error !== null &&
                            'status' in error &&
                            typeof (error as { status?: unknown }).status === 'number'
                            ? (error as { status: number }).status
                            : null;

                    // Don't retry authentication errors
                    if (status === 401 || status === 403) {
                        return false;
                    }

                    // Don't retry client errors (4xx) - these are validation/client errors
                    // that won't be fixed by retrying (e.g., 400 Bad Request, 404 Not Found)
                    if (status !== null && status >= 400 && status < 500) {
                        return false;
                    }

                    // Retry only for server errors (5xx) or network errors
                    // Network errors have status === null
                    return failureCount < 1;
                },
                refetchOnWindowFocus: false,
            },
            mutations: {
                onError: (error) => {
                    toast.error(getErrorMessage(error));
                },
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
    if (isServer) {
        return makeQueryClient();
    }

    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }

    return browserQueryClient;
}

type QueryProviderProps = {
    children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
    const queryClient = getQueryClient();

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
