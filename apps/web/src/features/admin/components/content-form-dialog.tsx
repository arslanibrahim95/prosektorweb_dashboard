'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ContentPost } from '@/types/admin';

const contentFormSchema = z.object({
    title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık çok uzun'),
    slug: z.string().min(1, 'Slug gereklidir').max(200, 'Slug çok uzun'),
    content: z.string().min(1, 'İçerik gereklidir'),
    status: z.enum(['draft', 'published', 'archived']),
    category: z.string().optional(),
    excerpt: z.string().max(500, 'Özet çok uzun').optional(),
    featured_image: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
    seo_title: z.string().max(60, 'SEO başlığı çok uzun').optional(),
    seo_description: z.string().max(160, 'SEO açıklaması çok uzun').optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

interface ContentFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'add' | 'edit';
    type: 'page' | 'post';
    initialData?: Partial<ContentPost>;
    onSubmit: (data: ContentFormValues) => Promise<void>;
}

export function ContentFormDialog({
    open,
    onOpenChange,
    mode,
    type,
    initialData,
    onSubmit,
}: ContentFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ContentFormValues>({
        resolver: zodResolver(contentFormSchema),
        defaultValues: {
            title: '',
            slug: '',
            content: '',
            status: 'draft',
            category: '',
            excerpt: '',
            featured_image: '',
            seo_title: '',
            seo_description: '',
        },
    });

    // Update form when initialData changes
    useEffect(() => {
        if (initialData && mode === 'edit') {
            form.reset({
                title: initialData.title || '',
                slug: initialData.slug || '',
                content: initialData.content || '',
                status: initialData.status || 'draft',
                category: initialData.category || '',
                excerpt: initialData.excerpt || '',
                featured_image: initialData.featured_image || '',
                seo_title: initialData.seo_title || '',
                seo_description: initialData.seo_description || '',
            });
        } else if (mode === 'add') {
            form.reset({
                title: '',
                slug: '',
                content: '',
                status: 'draft',
                category: '',
                excerpt: '',
                featured_image: '',
                seo_title: '',
                seo_description: '',
            });
        }
    }, [initialData, mode, form]);

    // Auto-generate slug from title
    const handleTitleChange = (title: string) => {
        if (mode === 'add') {
            const slug = title
                .toLowerCase()
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ı/g, 'i')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            form.setValue('slug', slug);
        }
    };

    const handleSubmit = async (data: ContentFormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = [
        { value: 'teknoloji', label: 'Teknoloji' },
        { value: 'is-dunyasi', label: 'İş Dünyası' },
        { value: 'hukuk', label: 'Hukuk' },
        { value: 'finans', label: 'Finans' },
        { value: 'egitim', label: 'Eğitim' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'add' ? 'Yeni ' : 'Düzenle: '}
                        {type === 'page' ? 'Sayfa' : 'Yazı'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'add'
                            ? `Yeni ${type === 'page' ? 'sayfa' : 'yazı'} oluşturun`
                            : `${type === 'page' ? 'Sayfa' : 'Yazı'} bilgilerini güncelleyin`}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Title */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Başlık *</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Başlık giriniz"
                                            onChange={(e) => {
                                                field.onChange(e);
                                                handleTitleChange(e.target.value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Slug */}
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="url-slug" />
                                    </FormControl>
                                    <FormDescription>
                                        URL'de görünecek benzersiz tanımlayıcı
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Content */}
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>İçerik *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="İçerik giriniz..."
                                            rows={8}
                                            className="resize-none"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Durum *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Durum seçiniz" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">Taslak</SelectItem>
                                                <SelectItem value="published">Yayında</SelectItem>
                                                <SelectItem value="archived">Arşiv</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Category (only for posts) */}
                            {type === 'post' && (
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kategori</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Kategori seçiniz" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.value} value={cat.value}>
                                                            {cat.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {/* Excerpt */}
                        <FormField
                            control={form.control}
                            name="excerpt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Özet</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Kısa özet..."
                                            rows={3}
                                            className="resize-none"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Featured Image */}
                        <FormField
                            control={form.control}
                            name="featured_image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Öne Çıkan Görsel URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="url"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* SEO Fields */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-medium">SEO Ayarları</h3>

                            <FormField
                                control={form.control}
                                name="seo_title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SEO Başlığı</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Arama motorları için başlık"
                                                maxLength={60}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {field.value?.length || 0}/60 karakter
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="seo_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Meta Açıklama</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Arama motorları için açıklama"
                                                rows={3}
                                                maxLength={160}
                                                className="resize-none"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {field.value?.length || 0}/160 karakter
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                İptal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'add' ? 'Oluştur' : 'Güncelle'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
