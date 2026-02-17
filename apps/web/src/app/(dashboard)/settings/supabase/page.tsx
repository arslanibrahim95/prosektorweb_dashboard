'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getSupabaseSettings } from '@/actions/update-env';
import { listBuckets, createBucket, deleteBucket, listFiles, uploadFile, deleteFile } from '@/actions/supabase-storage';
import { listTables } from '@/actions/supabase-database';
import { listAuthUsers, deleteAuthUser } from '@/actions/supabase-auth';
import { Loader2, Database, HardDrive, Settings, RefreshCw, Trash2, Plus, Folder, User, ShieldAlert, Upload, X, FileIcon, ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const formSchema = z.object({
    url: z.string().url({ message: 'Geçerli bir URL giriniz.' }),
    anonKey: z.string().min(1, { message: 'Anon Key gereklidir.' }),
    serviceRoleKey: z.string().optional(),
});

interface SupabaseBucket {
    id: string;
    public: boolean;
    created_at?: string | null;
}

interface SupabaseTable {
    name: string;
    [key: string]: unknown;
}

interface SupabaseFileMetadata {
    mimetype?: string;
    size?: number;
}

interface SupabaseFileEntry {
    id?: string;
    name: string;
    metadata?: SupabaseFileMetadata | null;
}

type SupabaseAuthUser = Pick<SupabaseUser, 'id' | 'email' | 'role' | 'email_confirmed_at'>;

export default function SupabaseSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [buckets, setBuckets] = useState<SupabaseBucket[]>([]);
    const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);
    const [tables, setTables] = useState<SupabaseTable[]>([]);
    const [isLoadingTables, setIsLoadingTables] = useState(false);
    const [tableMessage, setTableMessage] = useState('');
    const [authUsers, setAuthUsers] = useState<SupabaseAuthUser[]>([]);
    const [isLoadingAuth, setIsLoadingAuth] = useState(false);
    const [authError, setAuthError] = useState('');

    // Bucket creation state
    const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false);
    const [newBucketName, setNewBucketName] = useState('');
    const [newBucketPublic, setNewBucketPublic] = useState(true);
    const [isCreatingBucket, setIsCreatingBucket] = useState(false);

    // File explorer state
    const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
    const [files, setFiles] = useState<SupabaseFileEntry[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        type: 'auth-user' | 'bucket' | 'file';
        id: string;
        name: string;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            url: '',
            anonKey: '',
            serviceRoleKey: '',
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSupabaseSettings();
                form.reset({
                    url: settings.url || '',
                    anonKey: settings.anonKey || '',
                    serviceRoleKey: settings.serviceRoleKey || '',
                });
            } catch (error) {
                console.error('Failed to load settings:', error);
                toast.error('Ayarlar yüklenirken bir hata oluştu.');
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [form]);

    const fetchBuckets = useCallback(async () => {
        setIsLoadingBuckets(true);
        try {
            const result = await listBuckets();
            if (result.success) {
                setBuckets(result.data || []);
            } else {
                toast.error(`Bucket list hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to fetch buckets:', error);
            toast.error('Bucketlar yüklenemedi.');
        } finally {
            setIsLoadingBuckets(false);
        }
    }, []);

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
            console.error('Failed to fetch tables:', error);
            toast.error('Tablolar yüklenemedi.');
        } finally {
            setIsLoadingTables(false);
        }
    }, []);

    const fetchAuthUsers = useCallback(async () => {
        setIsLoadingAuth(true);
        setAuthError('');
        try {
            const result = await listAuthUsers();
            if (result.success) {
                setAuthUsers(result.data || []);
            } else {
                setAuthError(result.error || 'Kullanıcılar yüklenemedi. Service Role Key gerekli olabilir.');
            }
        } catch (error) {
            console.error('Failed to fetch auth users:', error);
            setAuthError('Kullanıcılar yüklenemedi. Service Role Key gerekli olabilir.');
        } finally {
            setIsLoadingAuth(false);
        }
    }, []);

    const handleDeleteAuthUser = async (id: string) => {
        setIsDeleting(true);
        try {
            const result = await deleteAuthUser(id);
            if (result.success) {
                toast.success(`Kullanıcı silindi.`);
                fetchAuthUsers();
            } else {
                toast.error(`Silme hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to delete auth user:', error);
            toast.error('Kullanıcı silinemedi.');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(null);
        }
    }

    const handleCreateBucket = async () => {
        if (!newBucketName.trim()) return;
        setIsCreatingBucket(true);
        try {
            if (!/^[a-z0-9.-]+$/.test(newBucketName)) {
                toast.error("Bucket ismi sadece küçük harf, rakam, nokta ve tire içerebilir.");
                return;
            }

            const result = await createBucket(newBucketName, newBucketPublic);
            if (result.success) {
                toast.success(`Bucket '${newBucketName}' oluşturuldu.`);
                setNewBucketName('');
                setIsCreateBucketOpen(false);
                fetchBuckets();
            } else {
                toast.error(`Oluşturma hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to create bucket:', error);
            toast.error('Bucket oluşturulamadı.');
        } finally {
            setIsCreatingBucket(false);
        }
    }

    const handleDeleteBucket = async (id: string) => {
        setIsDeleting(true);
        try {
            const result = await deleteBucket(id);
            if (result.success) {
                toast.success(`Bucket silindi.`);
                fetchBuckets();
            } else {
                toast.error(`Silme hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to delete bucket:', error);
            toast.error('Bucket silinemedi.');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(null);
        }
    }

    const fetchFiles = async (bucketName: string) => {
        setIsLoadingFiles(true);
        setSelectedBucket(bucketName);
        try {
            const result = await listFiles(bucketName);
            if (result.success) {
                setFiles(result.data || []);
            } else {
                toast.error(`Dosya listeleme hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
            toast.error('Dosyalar yüklenemedi.');
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBucket) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadFile(selectedBucket, file.name, formData);
            if (result.success) {
                toast.success('Dosya yüklendi.');
                fetchFiles(selectedBucket);
            } else {
                toast.error(`Yükleme hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
            toast.error('Dosya yüklenemedi.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async (fileName: string) => {
        if (!selectedBucket) return;
        setIsDeleting(true);
        try {
            const result = await deleteFile(selectedBucket, fileName);
            if (result.success) {
                toast.success('Dosya silindi.');
                fetchFiles(selectedBucket);
            } else {
                toast.error(`Silme hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
            toast.error('Dosya silinemedi.');
        } finally {
            setIsDeleting(false);
            setConfirmDialog(null);
        }
    };



    const [activeTab, setActiveTab] = useState("storage");

    // Fetch data when tab changes
    useEffect(() => {
        if (activeTab === "storage" && buckets.length === 0) {
            fetchBuckets();
        }
        if (activeTab === "database" && tables.length === 0) {
            fetchTables();
        }
        if (activeTab === "auth" && authUsers.length === 0) {
            fetchAuthUsers();
        }
    }, [activeTab, buckets.length, tables.length, authUsers.length, fetchBuckets, fetchTables, fetchAuthUsers]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Supabase Yönetimi</h3>
                <p className="text-sm text-muted-foreground">
                    Projenizin depolama alanlarını ve veritabanı durumunu yönetin.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
                    <TabsTrigger value="storage">Depolama</TabsTrigger>
                    <TabsTrigger value="database">Veritabanı</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                    <TabsTrigger value="rls">RLS Helper</TabsTrigger>
                    <TabsTrigger value="settings">Bağlantı</TabsTrigger>
                </TabsList>

                {/* Settings Tab (Read Only) */}
                <TabsContent value="settings" className="mt-6">
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Bağlantı Durumu
                            </CardTitle>
                            <CardDescription>
                                Sistem genelinde tanımlı Supabase bağlantı bilgileri (Salt Okunur).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Project URL</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={form.getValues().url || 'Tanımlı Değil'} readOnly className="bg-muted font-mono" />
                                    {form.getValues().url && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Bağlı</Badge>}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Anon Key</Label>
                                <Input value={form.getValues().anonKey ? '****************' : 'Tanımlı Değil'} readOnly className="bg-muted font-mono" />
                            </div>

                            <div className="grid gap-2">
                                <Label>Service Role Key</Label>
                                <Input value={form.getValues().serviceRoleKey ? '****************' : 'Tanımlı Değil'} readOnly className="bg-muted font-mono" />
                            </div>

                            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                <p className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4" />
                                    Bu bilgiler sistem yöneticisi tarafından yönetilir ve buradan değiştirilemez.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Storage Tab */}
                <TabsContent value="storage" className="mt-6">
                    <Card className="glass border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <HardDrive className="h-5 w-5" />
                                    Depolama Alanları (Buckets)
                                </CardTitle>
                                <CardDescription>
                                    Mevcut depolama alanlarını görüntüleyin ve yönetin.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={fetchBuckets} disabled={isLoadingBuckets}>
                                    <RefreshCw className={`h-4 w-4 ${isLoadingBuckets ? 'animate-spin' : ''}`} />
                                </Button>
                                <Dialog open={isCreateBucketOpen} onOpenChange={setIsCreateBucketOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="gap-2">
                                            <Plus className="h-4 w-4" /> Yeni Bucket
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Yeni Bucket Oluştur</DialogTitle>
                                            <DialogDescription>
                                                Yeni bir depolama alanı oluşturun. İsim benzersiz olmalıdır.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Bucket İsmi</Label>
                                                <Input
                                                    id="name"
                                                    value={newBucketName}
                                                    onChange={(e) => setNewBucketName(e.target.value)}
                                                    placeholder="my-bucket"
                                                />
                                                <span className="text-xs text-muted-foreground">Sadece küçük harf, rakam ve tire.</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id="public"
                                                    checked={newBucketPublic}
                                                    onCheckedChange={setNewBucketPublic}
                                                />
                                                <Label htmlFor="public">Public (Herkes erişebilir)</Label>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsCreateBucketOpen(false)}>İptal</Button>
                                            <Button onClick={handleCreateBucket} disabled={isCreatingBucket}>
                                                {isCreatingBucket ? 'Oluşturuluyor...' : 'Oluştur'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingBuckets ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : buckets.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Henüz hiç bucket yok.
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {buckets.map((bucket) => (
                                        <Card key={bucket.id} className="overflow-hidden border-border/40 hover:border-primary/50 transition-colors">
                                            <CardContent className="p-4 flex flex-col gap-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Folder className="h-8 w-8 text-primary/80" />
                                                        <div>
                                                            <h4 className="font-semibold text-sm truncate max-w-[120px]" title={bucket.id}>{bucket.id}</h4>
                                                            <Badge variant={bucket.public ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5">
                                                                {bucket.public ? 'Public' : 'Private'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-primary"
                                                            onClick={() => fetchFiles(bucket.id)}
                                                            title="Dosyaları Görüntüle"
                                                        >
                                                            <Folder className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setConfirmDialog({ type: 'bucket', id: bucket.id, name: bucket.id })}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    <p>Oluşturuldu: {bucket.created_at ? new Date(bucket.created_at).toLocaleDateString() : '-'}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Dialog open={!!selectedBucket} onOpenChange={(open) => !open && setSelectedBucket(null)}>
                        <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Folder className="h-5 w-5" />
                                    {selectedBucket}
                                </DialogTitle>
                                <DialogDescription>
                                    Bu bucket içindeki dosyaları yönetin.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex justify-between items-center py-2">
                                <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                    Dosya Yükle
                                </Button>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleUploadFile}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-muted/20">
                                {isLoadingFiles ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : files.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                        <Folder className="h-10 w-10 opacity-20" />
                                        <p>Bu bucket boş.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {files.map((file) => (
                                            <div key={file.id ?? file.name} className="group relative border rounded-md p-3 hover:bg-muted/50 transition-colors flex flex-col items-center gap-2">
                                                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                                                    {file.metadata?.mimetype?.startsWith('image/') ? (
                                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                    ) : (
                                                        <FileIcon className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <span className="text-xs text-center truncate w-full" title={file.name}>{file.name}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {((file.metadata?.size ?? 0) / 1024).toFixed(1)} KB
                                                </span>

                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setConfirmDialog({ type: 'file', id: file.name, name: file.name })}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* Database Tab */}
                <TabsContent value="database" className="mt-6">
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
                                                        navigator.clipboard.writeText(`create or replace function get_tables()
returns table (
  name text
) 
language sql 
security definer 
as $$
  select table_name::text
  from information_schema.tables
  where table_schema = 'public';
$$;`);
                                                        toast.success('SQL kopyalandı!');
                                                    }}
                                                >
                                                    Kopyala
                                                </Button>
                                                <pre>{`create or replace function get_tables()
returns table (
  name text
) 
language sql 
security definer 
as $$
  select table_name::text
  from information_schema.tables
  where table_schema = 'public';
$$;`}</pre>
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
                </TabsContent>

                {/* Auth Tab */}
                <TabsContent value="auth" className="mt-6">
                    <Card className="glass border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Auth Kullanıcıları
                                </CardTitle>
                                <CardDescription>
                                    Supabase Auth (&apos;auth.users&apos;) tablosundaki kullanıcılar.
                                    <br />
                                    <span className="text-xs text-warning">Görüntülemek için Service Role Key gereklidir.</span>
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="icon" onClick={fetchAuthUsers} disabled={isLoadingAuth}>
                                <RefreshCw className={`h-4 w-4 ${isLoadingAuth ? 'animate-spin' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAuth ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {authError ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                                            <ShieldAlert className="h-10 w-10 text-destructive/50" />
                                            <p className="text-muted-foreground max-w-md">{authError}</p>
                                            <p className="text-xs text-muted-foreground">Lütfen &apos;Ayarlar&apos; sekmesinden Service Role Key girildiğinden emin olun.</p>
                                        </div>
                                    ) : authUsers.length > 0 ? (
                                        <div className="space-y-2">
                                            {authUsers.map((user) => (
                                                <div key={user.id} className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-card/50">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{user.email}</span>
                                                        <span className="text-xs text-muted-foreground">ID: {user.id}</span>
                                                        <div className="flex gap-2 mt-1">
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                                {user.role}
                                                            </Badge>
                                                            <Badge variant={user.email_confirmed_at ? "default" : "secondary"} className="text-[10px] h-4 px-1">
                                                                {user.email_confirmed_at ? 'Email Onaylı' : 'Onay Bekliyor'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setConfirmDialog({ type: 'auth-user', id: user.id, name: user.email || user.id })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">Kullanıcı bulunamadı.</div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* RLS Policy Helper Tab */}
                <TabsContent value="rls" className="mt-6">
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
                            <RLSPolicyGenerator tables={tables} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Unified Confirm Dialog */}
            <ConfirmDialog
                open={!!confirmDialog}
                onOpenChange={(open) => !open && setConfirmDialog(null)}
                title={
                    confirmDialog?.type === 'auth-user' ? 'Kullanıcıyı Sil' :
                        confirmDialog?.type === 'bucket' ? "Bucket'ı Sil" :
                            'Dosyayı Sil'
                }
                description={
                    confirmDialog?.type === 'auth-user'
                        ? `'${confirmDialog.name}' kullanıcısını silmek istediğinize emin misiniz?`
                        : confirmDialog?.type === 'bucket'
                            ? `'${confirmDialog.name}' bucket'ını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                            : `'${confirmDialog?.name}' dosyasını silmek istediğinize emin misiniz?`
                }
                confirmLabel="Sil"
                onConfirm={() => {
                    if (!confirmDialog) return;
                    if (confirmDialog.type === 'auth-user') handleDeleteAuthUser(confirmDialog.id);
                    else if (confirmDialog.type === 'bucket') handleDeleteBucket(confirmDialog.id);
                    else handleDeleteFile(confirmDialog.id);
                }}
                isLoading={isDeleting}
            />
        </div>
    );
}

function RLSPolicyGenerator({ tables }: { tables: SupabaseTable[] }) {
    const [tableName, setTableName] = useState('');
    const [policyType, setPolicyType] = useState('public_read');
    const selectedTableName = tableName || tables[0]?.name || '';

    const generateSQL = () => {
        if (!selectedTableName) return '-- Lütfen bir tablo ismi girin.';

        const safeTableName = selectedTableName.replace(/[^a-zA-Z0-9_]/g, '');
        let sql = `-- ${safeTableName} tablosu için RLS Politikası\n`;
        sql += `alter table "${safeTableName}" enable row level security;\n\n`;

        switch (policyType) {
            case 'public_read':
                sql += `create policy "Herkes okuyabilir"
on "${safeTableName}"
for select
to anon
using ( true );`;
                break;
            case 'auth_read':
                sql += `create policy "Sadece giriş yapmış kullanıcılar okuyabilir"
on "${safeTableName}"
for select
to authenticated
using ( true );`;
                break;
            case 'user_own_rows':
                sql += `create policy "Kullanıcılar sadece kendi verilerini yönetebilir"
on "${safeTableName}"
for all
to authenticated
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );`;
                break;
            case 'public_insert':
                sql += `create policy "Herkes ekleyebilir"
on "${safeTableName}"
for insert
to anon
with check ( true );`;
                break;
            default:
                sql += `-- Seçilen politika tipi desteklenmiyor.`;
        }
        return sql;
    };

    const sqlCode = generateSQL();

    return (
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
    );
}
