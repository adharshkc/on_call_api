import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { JwtService } from '#services/jwt_service'
import Admin from '#models/admin'

/**
 * JWT Auth middleware is used to authenticate HTTP requests using JWT tokens
 */
export default class JwtAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Get token from Authorization header
    const authHeader = request.header('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({
        message: 'Access token required',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    const payload = JwtService.verifyToken(token)
    
    if (!payload) {
      return response.status(401).json({
        message: 'Invalid or expired token',
      })
    }

    // Find the admin
    const admin = await Admin.find(payload.id)
    
    if (!admin) {
      return response.status(401).json({
        message: 'Admin not found',
      })
    }

    if (!admin.isActive) {
      return response.status(401).json({
        message: 'Account is deactivated',
      })
    }

    // Add admin to the request context
    ctx.admin = admin

    return next()
  }
}
