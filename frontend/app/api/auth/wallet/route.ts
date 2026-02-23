import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, signature, message, timestamp, chainId } = body

    // Validate required fields
    if (!address || !signature || !message || !timestamp || !chainId) {
      return NextResponse.json({ 
        error: "Missing required fields: address, signature, message, timestamp, chainId" 
      }, { status: 400 })
    }

    // Validate address format
    if (!authService.isValidAddress(address)) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 })
    }

    // For now, just generate a token without signature verification
    // In a production app, you would verify the signature here
    const token = authService.generateToken(address)

    return NextResponse.json({
      success: true,
      token,
      user: {
        address,
        chainId,
        isVerified: false,
        lastLoginAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json({ 
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}