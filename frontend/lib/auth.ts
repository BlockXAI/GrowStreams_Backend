// Simplified authentication utilities for Provn platform
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { NextRequest } from 'next/server'

export interface AuthUser {
  address: string
  handle?: string
  displayName?: string
  bio?: string
  avatarUrl?: string
  isVerified: boolean
  chainId: string
  lastLoginAt?: string
}

export interface AuthSession {
  address: string
  expiresAt: number
  sessionToken: string
}

export interface AuthResult {
  isAuthenticated: boolean
  user?: AuthUser
  session?: AuthSession
  error?: string
}

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret'
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Basic address validation
   */
  isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false
    
    // Basic Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    return ethAddressRegex.test(address)
  }

  /**
   * Authenticate a request (simplified version)
   */
  async authenticateRequest(request: NextRequest): Promise<AuthResult> {
    try {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { isAuthenticated: false, error: 'No auth token provided' }
      }

      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, this.JWT_SECRET) as any

      if (!decoded.address || !this.isValidAddress(decoded.address)) {
        return { isAuthenticated: false, error: 'Invalid token' }
      }

      const user: AuthUser = {
        address: decoded.address,
        handle: decoded.handle,
        displayName: decoded.displayName,
        isVerified: false,
        chainId: '8453', // Base mainnet
        lastLoginAt: new Date().toISOString()
      }

      return {
        isAuthenticated: true,
        user
      }
    } catch (error) {
      return { isAuthenticated: false, error: 'Token verification failed' }
    }
  }

  /**
   * Generate a simple JWT token
   */
  generateToken(address: string, handle?: string): string {
    return jwt.sign(
      { 
        address, 
        handle,
        timestamp: Date.now()
      },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    )
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return true // Always healthy in simplified version
  }
}

export const authService = new AuthService()