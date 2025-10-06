import jwt from 'jsonwebtoken'
import env from '#start/env'

export interface JwtPayload {
  id: number
  email: string
  role: string
}

export class JwtService {
  private static secret = env.get('JWT_SECRET', 'your-secret-key')
  private static expiresIn = env.get('JWT_EXPIRES_IN', '24h')

  /**
   * Generate JWT token
   */
  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'daily-care-api',
    } as jwt.SignOptions)
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as any
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Decode JWT token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token)
    } catch (error) {
      return null
    }
  }
}
