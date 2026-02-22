'use server';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdminSettings } from './update-env';
import { logger } from '@/lib/logger';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.';
}

async function getClient() {
    const settings = await getSupabaseAdminSettings();
    if (!settings.url || !settings.serviceRoleKey) {
        throw new Error('Supabase URL or Service Role Key is missing');
    }
    return createClient(settings.url, settings.serviceRoleKey);
}

export async function listBuckets() {
    try {
        const client = await getClient();
        const { data, error } = await client.storage.listBuckets();
        if (error) throw error;
        return { success: true, data };
    } catch (error: unknown) {
        logger.error('Error listing buckets', { error });
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createBucket(name: string, isPublic: boolean = true) {
    try {
        const client = await getClient();
        const { data, error } = await client.storage.createBucket(name, {
            public: isPublic,
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error: unknown) {
        logger.error('Error creating bucket', { error });
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteBucket(id: string) {
    try {
        const client = await getClient();
        const { data, error } = await client.storage.deleteBucket(id);
        if (error) throw error;
        return { success: true, data };
    } catch (error: unknown) {
        logger.error('Error deleting bucket', { error });
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function listFiles(bucketName: string, path: string = '') {
    try {
        const client = await getClient();
        const { data, error } = await client.storage.from(bucketName).list(path);
        if (error) throw error;
        return { success: true, data };
    } catch (error: unknown) {
        logger.error('Error listing files', { error });
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function uploadFile(bucketName: string, path: string, formData: FormData) {
    try {
        const client = await getClient();
        const file = formData.get('file') as File;

        if (!file) {
            throw new Error('No file provided');
        }

        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Dosya boyutu çok büyük. Maksimum: 50MB`);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await client.storage
            .from(bucketName)
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) throw error;
        return { success: true, data };
    } catch (error: unknown) {
        logger.error('Error uploading file', { error });
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteFile(bucketName: string, path: string) {
    try {
        const client = await getClient();
        const { data, error } = await client.storage
            .from(bucketName)
            .remove([path]);

        if (error) throw error;
        return { success: true, data };
    } catch (error: unknown) {
        logger.error('Error deleting file', { error });
        return { success: false, error: getErrorMessage(error) };
    }
}
