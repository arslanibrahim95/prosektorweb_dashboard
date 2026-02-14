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

                    if (status === 401 || status === 403) {
                        return false;
                    }

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
