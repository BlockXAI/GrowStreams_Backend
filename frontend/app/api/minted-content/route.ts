import { NextResponse } from 'next/server'

export async function GET() {
  // Mock data for frontend development
  return NextResponse.json({
    success: true,
    data: []
  })
}

export async function POST() {
  // Mock data for frontend development
  return NextResponse.json({
    success: true,
    data: { id: 'mock_' + Date.now() }
  })
}