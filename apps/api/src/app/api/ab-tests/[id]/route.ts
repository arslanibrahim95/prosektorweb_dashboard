import { NextRequest, NextResponse } from 'next/server'
import { requireAuthContext } from '@/server/auth/context'
import { z } from 'zod'
import {
    HttpError,
    zodErrorToDetails,
    jsonError,
    mapPostgrestError
} from '@/server/api/http'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// A/B Test güncelleme şeması
const updateAbTestSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'running', 'paused', 'completed']).optional(),
    traffic_split: z.array(z.number()).length(2).optional(),
    variants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        weight: z.number().min(0).max(100)
    })).optional(),
    goals: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['pageview', 'click', 'conversion', 'custom']),
        target_url: z.string().optional(),
        selector: z.string().optional()
    })).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    confidence_level: z.number().min(0).max(100).optional()
})

// GET - Tek A/B test detaylarını getir
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await requireAuthContext(request)
        const { id } = await params

        const { data, error } = await ctx.admin
            .from('ab_tests')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', ctx.tenant.id)
            .single()

        if (error) {
            throw mapPostgrestError(error)
        }

        // Parse JSON fields
        const parsedData = {
            ...data,
            variants: typeof data.variants === 'string' ? JSON.parse(data.variants) : data.variants,
            goals: typeof data.goals === 'string' ? JSON.parse(data.goals) : data.goals
        }

        return NextResponse.json({ data: parsedData })
    } catch (error) {
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status, error.headers)
        }
        console.error('A/B Test get error:', error)
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500)
    }
}

// PUT - A/B test güncelle
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await requireAuthContext(request)
        const { id } = await params
        const body = await request.json()
        const validation = updateAbTestSchema.safeParse(body)

        if (!validation.success) {
            throw new HttpError(400, {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: zodErrorToDetails(validation.error)
            })
        }

        const updateData: Record<string, unknown> = { ...validation.data }

        // JSON string olarak saklanacak alanları dönüştür
        if (updateData.variants) {
            updateData.variants = JSON.stringify(updateData.variants)
        }
        if (updateData.goals) {
            updateData.goals = JSON.stringify(updateData.goals)
        }

        const { data, error } = await ctx.admin
            .from('ab_tests')
            .update(updateData)
            .eq('id', id)
            .eq('tenant_id', ctx.tenant.id)
            .select()
            .single()

        if (error) {
            throw mapPostgrestError(error)
        }

        return NextResponse.json({ data })
    } catch (error) {
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status, error.headers)
        }
        console.error('A/B Test update error:', error)
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500)
    }
}

// DELETE - A/B test sil
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await requireAuthContext(request)
        const { id } = await params

        const { error } = await ctx.admin
            .from('ab_tests')
            .delete()
            .eq('id', id)
            .eq('tenant_id', ctx.tenant.id)

        if (error) {
            throw mapPostgrestError(error)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof HttpError) {
            return jsonError(error.body, error.status, error.headers)
        }
        console.error('A/B Test delete error:', error)
        return jsonError({ code: 'INTERNAL_ERROR', message: 'Internal server error' }, 500)
    }
}
