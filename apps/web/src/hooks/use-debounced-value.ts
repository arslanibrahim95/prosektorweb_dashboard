import { useEffect, useState } from 'react';

/**
 * Debounces a value by delaying updates until the value has stopped changing
 * for the specified delay period.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearch = useDebouncedValue(searchQuery, 500);
 *
 * // Use debouncedSearch in your API calls
 * const { data } = useQuery({
 *   queryKey: ['search', debouncedSearch],
 *   queryFn: () => api.search(debouncedSearch),
 * });
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
