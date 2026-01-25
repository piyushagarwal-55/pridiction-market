import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PlaceBetSchema = z.object({
    marketId: z.string().min(1).optional(),
    market_id: z.string().min(1).optional(),
    side: z.string().min(1).optional(),
    choice: z.string().min(1).optional(),
    sport: z.string().optional(),
    stake: z.coerce.number().min(0.01, 'Minimum stake $0.01').max(100, 'Maximum stake $100'),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        
        console.log('[PLACE-BET] Request body:', body)
        
        const parsed = PlaceBetSchema.parse(body)

        const marketId = parsed.market_id ?? parsed.marketId
        if (!marketId) {
            console.error('[PLACE-BET] Missing market ID')
            return NextResponse.json(
                { error: 'Market ID required' },
                { status: 400 }
            )
        }

        const side = (parsed.side ?? parsed.choice ?? 'home').toString()
        const stake = parsed.stake
        
        console.log(`[PLACE-BET] Forwarding: market=${marketId}, side=${side}, stake=${stake}`)

        const apiBaseUrl =
            process.env.API_BASE_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            'http://localhost:8000'

        const upstreamResponse = await fetch(`${apiBaseUrl}/api/v1/x402/place-bet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                market_id: marketId,
                side,
                stake,
            }),
        })

        const responseBody = await upstreamResponse.text()
        
        console.log(`[PLACE-BET] Backend response: ${upstreamResponse.status}`)
        console.log(`[PLACE-BET] Response body:`, responseBody.substring(0, 200))
        
        const headers = new Headers()
        const contentType = upstreamResponse.headers.get('content-type')
        if (contentType) {
            headers.set('content-type', contentType)
        }

        const paymentRequired = upstreamResponse.headers.get('Payment-Required')
        const quoteId = upstreamResponse.headers.get('X-Quote-ID')
        const retryAfter = upstreamResponse.headers.get('Retry-After')

        if (paymentRequired) {
            console.log(`[PLACE-BET] Payment-Required: ${paymentRequired}`)
            console.log(`[PLACE-BET] Quote-ID: ${quoteId}`)
            headers.set('Payment-Required', paymentRequired)
        }
        if (quoteId) headers.set('X-Quote-ID', quoteId)
        if (retryAfter) headers.set('Retry-After', retryAfter)

        return new NextResponse(responseBody, {
            status: upstreamResponse.status,
            headers,
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('[PLACE-BET] Validation error:', error.errors)
            return NextResponse.json(
                { error: 'Invalid request', details: error.errors },
                { status: 400 }
            )
        }

        console.error('[PLACE-BET-ERROR]', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
