'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, ShieldAlert, RefreshCw } from 'lucide-react';
import { listTables } from '@/actions/supabase-database';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { SupabaseTable } from '../types/supabase';

const GET_TABLES_SQL = `create or replace function get_tables()
returns table (
  name text
) 
language sql 
security definer 
as $$
  select table_name::text
  from information_schema.tables
  where table_schema = 'public';
$$;`;

export function DatabaseTablesPanel() {
    const [tables, setTables] = useState<SupabaseTable[]>([]);
    const [isLoadingTables, setIsLoadingTables] = useState(false);
    const [tableMessage, setTableMessage] = useState('');

    const fetchTables = useCallback(async () => {
        setIsLoadingTables(true);
        setTableMessage('');
        try {
            const result = await listTables();
            if (result.success) {
                setTables(result.data || []);
                if (result.message) setTableMessage(result.message);
            } else {
                toast.error(`Tablo list hatası: ${result.error}`);
            }
        } catch (error) {
            logger.error('Failed to fetch tables', { error });
            toast.error('Tablolar yüklenemedi.');
        } finally {
            setIsLoadingTables(false);
        }
    }, []);

    return (
        <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Veritabanı Tabloları
                    </CardTitle>
                    <CardDescription>
                        Veritabanındaki genel tabloları görüntüleyin.
                    </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={fetchTables} disabled={isLoadingTables}>
                    <RefreshCw className={`h-4 w-4 ${isLoadingTables ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                {isLoadingTables ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tableMessage && (
                            <div className="p-4 rounded-md bg-muted text-sm text-muted-foreground flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground mb-1">Kurulum Gerekli</p>
                                        <p>{tableMessage}</p>
                                    </div>
                                </div>

                                <div className="bg-background/50 p-3 rounded border border-border/50 font-mono text-xs overflow-x-auto relative group">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-1 right-1 h-6 text-[10px]"
                                        onClick={() => {
                                            navigator.clipboard.writeText(GET_TABLES_SQL);
                                            toast.success('SQL kopyalandı!');
                                        }}
                                    >
                                        Kopyala
                                    </Button>
                                    <pre>{GET_TABLES_SQL}</pre>
                                </div>
                            </div>
                        )}

                        {tables.length > 0 ? (
                            <div className="grid gap-2">
                                {tables.map((table, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-md border border-border/40 bg-card/50">
                                        <Database className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-sm">{table.name || JSON.stringify(table)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !tableMessage && <div className="text-center py-8 text-muted-foreground">Görüntülenecek tablo bulunamadı.</div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
