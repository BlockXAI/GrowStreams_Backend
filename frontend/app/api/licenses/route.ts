import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (use database in production)
const licenses = new Map<string, Array<{
  id: string
  tokenId: string
  periods: number
  totalCost: string
  purchaser: string
  timestamp: string
  expiresAt: string
  status: 'active' | 'expired'
}>>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenId, periods, totalCost, purchaser, timestamp } = body

    if (!tokenId || !periods || !totalCost || !purchaser) {
      return NextResponse.json(
        { success: false, error: 'All license details required' },
        { status: 400 }
      )
    }

    console.log('📄 Licenses API: Recording license purchase', { tokenId, periods, purchaser })

    const licenseId = `license_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Calculate expiry (assuming 30 days per period for demo)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (periods * 30))
    
    const newLicense = {
      id: licenseId,
      tokenId,
      periods,
      totalCost,
      purchaser,
      timestamp: timestamp || new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active' as const
    }

    // Store license
    if (!licenses.has(tokenId)) {
      licenses.set(tokenId, [])
    }
    licenses.get(tokenId)!.push(newLicense)

    console.log('📄 Licenses API: License recorded successfully', { licenseId })

    // In production, save to database
    // await db.licenses.create({
    //   data: {
    //     id: licenseId,
    //     tokenId,
    //     purchaser,
    //     periods,
    //     totalCost,
    //     timestamp: new Date(timestamp),
    //     expiresAt,
    //     transactionHash: '', // Would be populated after blockchain confirmation
    //     status: 'active'
    //   }
    // })

    return NextResponse.json({
      success: true,
      licenseId,
      expiresAt: expiresAt.toISOString(),
      message: 'License purchase recorded successfully'
    })

  } catch (error) {
    console.error('❌ Licenses API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record license purchase' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')
    const purchaser = searchParams.get('purchaser')

    if (tokenId) {
      // Get licenses for a specific token
      const tokenLicenses = licenses.get(tokenId) || []
      
      return NextResponse.json({
        success: true,
        licenses: tokenLicenses,
        count: tokenLicenses.length
      })
    }

    if (purchaser) {
      // Get licenses purchased by a specific user
      const userLicenses = []
      for (const [token, tokenLicenses] of licenses.entries()) {
        const userTokenLicenses = tokenLicenses.filter(license => license.purchaser === purchaser)
        userLicenses.push(...userTokenLicenses)
      }
      
      return NextResponse.json({
        success: true,
        licenses: userLicenses,
        count: userLicenses.length
      })
    }

    // Get all licenses
    const allLicenses = []
    for (const [token, tokenLicenses] of licenses.entries()) {
      allLicenses.push(...tokenLicenses)
    }

    return NextResponse.json({
      success: true,
      licenses: allLicenses.slice(-50), // Return last 50 licenses
      count: allLicenses.length
    })

  } catch (error) {
    console.error('❌ Licenses API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}