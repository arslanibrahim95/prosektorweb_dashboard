'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert } from 'lucide-react';
import { listTables } from '@/actions/supabase-database';
import { toast } from 'sonner';
import type { SupabaseTable } from '../types/supabase';

function generatePolicySQL(tableName: string, policyType: string): string {
    if (!tableName) return '-- Lütfen bir tablo ismi girin.';

    const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    let sql = `-- ${safeTableName} tablosu için RLS Politikası\n`;
    sql += `alter table "${safeTableName}" enable row level security;\n\n`;

    switch (policyType) {
        case 'public_read':
            sql += `create policy "Herkes okuyabilir"\non "${safeTableName}"\nfor select\nto anon\nusing ( true );`;
            break;
        case 'auth_read':
            sql += `create policy "Sadece giriş yapmış kullanıcılar okuyabilir"\non "${safeTableName}"\nfor select\nto authenticated\nusing ( true );`;
            break;
        case 'user_own_rows':
            sql += `create policy "Kullanıcılar sadece kendi verilerini yönetebilir"\non "${safeTableName}"\nfor all\nto authenticated\nusing ( auth.uid() = user_id )\nwith check ( auth.uid() = user_id );`;
            break;
        case 'public_insert':
            sql += `create policy "Herkes ekleyebilir"\non "${safeTableName}"\nfor insert\nto anon\nwith check ( true );`;
            break;
        default:
            sql += `-- Seçilen politika tipi desteklenmiyor.`;
    }
    return sql;
}

export function RLSPolicyGenerator() {
    const [tableName, setTableName] = useState('');
    const [policyType, setPolicyType] = useState('public_read');
    const [tables, setTables] = useState<SupabaseTable[]>([]);

    const fetchTables = useCallback(async () => {
        try {
            const result = await listTables();
            if (result.success) {
                setTables(result.data || []);
            }
        } catch {
            // Silently fail — manual input is available as fallback
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchTables();
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [fetchTables]);

    const selectedTableName = tableName || tables[0]?.name || '';

    const sqlCode = generatePolicySQL(selectedTableName, policyType);

    return (
        <Card className="glass border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    RLS Politikası Oluşturucu
                </CardTitle>
                <CardDescription>
                    Veritabanı tablolarınız için Row Level Security (RLS) politikaları oluşturun.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Tablo İsmi</Label>
                            {tables.length > 0 ? (
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedTableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                >
                                    <option value="">Tablo Seçin</option>
                                    {tables.map((t, i) => (
                                        <option key={i} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    placeholder="users, posts, etc."
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Politika Tipi</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={policyType}
                                onChange={(e) => setPolicyType(e.target.value)}
                            >
                                <option value="public_read">Halka Açık Okuma (Public Read)</option>
                                <option value="auth_read">Üye Okuma (Auth Read)</option>
                                <option value="user_own_rows">Kullanıcı Verisi (User Own Rows)</option>
                                <option value="public_insert">Halka Açık Ekleme (Public Insert)</option>
                            </select>
                        </div>
                    </div>

                    <div className="rounded-md border bg-muted p-4 relative group">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-6 text-xs"
                            onClick={() => {
                                navigator.clipboard.writeText(sqlCode);
                                toast.success('SQL kopyalandı!');
                            }}
                        >
                            Kopyala
                        </Button>
                        <pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap text-foreground">
                            {sqlCode}
                        </pre>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        <p>Not: Bu SQL kodunu Supabase Dashboard&apos;daki SQL Editor bölümünde çalıştırın.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
