'use server';

import { createClient } from '@supabase/supabase-js';
import { getSupabaseSettings } from './update-env';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.';
}

async function getClient() {
    const settings = await getSupabaseSettings();
    if (!settings.url || !settings.anonKey) {
        throw new Error('Supabase URL or Anon Key is missing');
    }
    // Use Service Role Key if available for administrative tasks like creating buckets,
    // otherwise fallback to Anon Key (which might fail depending on RLS/Policies).
    const key = settings.serviceRoleKey || settings.anonKey;
    return createClient(settings.url, key);
}

export async function listBuckets() {
    try {
        const client = await getClient();
        const { data, error } = await client.storage.listBuckets();
        if (error) throw error;
        return { success: true, data };
    } catch (error: unknown) {
        console.error('Error listing buckets:', error);
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
        console.error('Error creating bucket:', error);
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
        console.error('Error deleting bucket:', error);
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
        console.error('Error listing files:', error);
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
        console.error('Error uploading file:', error);
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
        console.error('Error deleting file:', error);
        return { success: false, error: getErrorMessage(error) };
    }
}
