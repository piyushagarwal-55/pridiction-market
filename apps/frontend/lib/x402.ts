'use client'

import { useState } from 'react'
import { useWalletClient, useSwitchChain } from 'wagmi'
import { isAddress, parseEther, type Address } from 'viem'

const MONAD_TESTNET_CHAIN_ID = 10143

interface X402Payload {
    stake: number
    [key: string]: unknown
}

interface X402Result {
    success: boolean
    quoteId?: string
    positionId?: string
    error?: string
}

interface X402Options {
    confirmEndpoint?: string
}

interface PaymentRequest {
    address: Address
    amount?: string
}

function parsePaymentRequiredHeader(paymentRequired: string): PaymentRequest | null {
    // Support multiple network prefixes: crypto-cronos://, crypto-monad-testnet://, crypto://
    const sanitized = paymentRequired.replace(/^crypto-[a-z-]+:\/\//i, '').replace(/^crypto:\/\//i, '')
    if (!sanitized) return null

    const [left, right] = sanitized.split('@')
    const [addressPart, query] = left.split('?')
    const amountFromQuery = query ? new URLSearchParams(query).get('amount') ?? undefined : undefined

    const amount = amountFromQuery ?? right
    const address = addressPart.trim()

    if (!isAddress(address)) return null

    return { address: address as Address, amount }
}

export function useX402Pay(endpoint: string, options: X402Options = {}) {
    const [isPaying, setIsPaying] = useState(false)
    const { data: walletClient } = useWalletClient()
    const { switchChainAsync } = useSwitchChain()
    const confirmEndpoint = options.confirmEndpoint ?? '/api/x402/confirm'

    const pay = async (payload: X402Payload): Promise<X402Result> => {
        setIsPaying(true)
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (response.status === 402) {
                // Handle 402 payment required
                const paymentUrl = response.headers.get('Payment-Required')
                const quoteId = response.headers.get('X-Quote-ID')

                console.log('[X402] Received 402 Payment Required')
                console.log('[X402] Payment-Required header:', paymentUrl)
                console.log('[X402] Quote ID:', quoteId)

                if (!paymentUrl || !quoteId) {
                    return { success: false, error: 'Missing payment request details' }
                }

                const paymentRequest = parsePaymentRequiredHeader(paymentUrl)
                console.log('[X402] Parsed payment request:', paymentRequest)
                
                if (!paymentRequest) {
                    return { success: false, error: 'Invalid payment request' }
                }

                if (!walletClient) {
                    console.error('[X402] Wallet client not available')
                    return { success: false, error: 'Wallet client not available' }
                }

                // Check if we're on the correct network (Monad Testnet)
                if (walletClient.chain.id !== MONAD_TESTNET_CHAIN_ID) {
                    console.log('[X402] Wrong network detected. Current:', walletClient.chain.id, 'Expected:', MONAD_TESTNET_CHAIN_ID)
                    try {
                        console.log('[X402] Switching to Monad Testnet...')
                        await switchChainAsync({ chainId: MONAD_TESTNET_CHAIN_ID })
                        console.log('[X402] Successfully switched to Monad Testnet')
                    } catch (error) {
                        console.error('[X402] Failed to switch network:', error)
                        return { success: false, error: 'Please switch to Monad Testnet in your wallet' }
                    }
                }

                const fallbackStake = typeof payload.stake === 'number' ? payload.stake : Number(payload.stake ?? 0)
                const amount = paymentRequest.amount ?? String(fallbackStake)
                console.log('[X402] Payment amount:', amount, 'MON')
                
                if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
                    return { success: false, error: 'Invalid payment amount' }
                }

                console.log('[X402] Sending transaction to:', paymentRequest.address)
                console.log('[X402] Transaction value:', parseEther(amount).toString(), 'wei')
                
                const txHash = await walletClient.sendTransaction({
                    to: paymentRequest.address,
                    value: parseEther(amount),
                })
                
                console.log('[X402] Transaction sent! Hash:', txHash)

                const confirmResponse = await fetch(confirmEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quote_id: quoteId }),
                })

                if (!confirmResponse.ok) {
                    const errorData = await confirmResponse.json().catch(() => ({}))
                    return {
                        success: false,
                        error: errorData?.error || errorData?.detail || 'Payment confirmation failed',
                    }
                }

                const confirmData = await confirmResponse.json()
                return { success: true, quoteId, ...confirmData }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                return { success: false, error: errorData?.error || errorData?.detail || 'Payment failed' }
            }

            const data = await response.json()
            return { success: true, ...data }
        } catch (error) {
            return { success: false, error: (error as Error).message }
        } finally {
            setIsPaying(false)
        }
    }

    return { pay, isPaying }
}
