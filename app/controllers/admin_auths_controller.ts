import type { HttpContext } from '@adonisjs/core/http'
import Admin from '#models/admin'
import hash from '@adonisjs/core/services/hash'
import { JwtService } from '#services/jwt_service'
import {
  loginValidator,
  registerValidator,
  updateProfileValidator,
  changePasswordValidator,
} from '#validators/admin_auth'

export default class AdminAuthsController {
  /**
   * Login admin
   */
  async login({ request, response }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)
    const { email, password } = payload

    try {
      // Find admin by email
      const admin = await Admin.findBy('email', email)

      if (!admin) {
        return response.status(401).json({
          message: 'Invalid credentials',
        })
      }

      // Check if admin is active
      if (!admin.isActive) {
        return response.status(401).json({
          message: 'Account is deactivated',
        })
      }

      // Verify password
      const isValid = await hash.verify(admin.password, password)

      if (!isValid) {
        return response.status(401).json({
          message: 'Invalid credentials',
        })
      }

      // Create JWT token
      const token = JwtService.generateToken({
        id: admin.id,
        email: admin.email,
        role: admin.role,
      })

      return response.json({
        message: 'Login successful',
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
        },
        token,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Something went wrong',
        error: error.message,
      })
    }
  }

  /**
   * Create a new admin (only for super admin or initial setup)
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const { fullName, email, password, role } = payload

    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findBy('email', email)

      if (existingAdmin) {
        return response.status(400).json({
          message: 'Admin with this email already exists',
        })
      }

      // Create new admin
      const admin = await Admin.create({
        fullName,
        email,
        password,
        role: role || 'admin',
        isActive: true,
      })

      return response.status(201).json({
        message: 'Admin created successfully',
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Something went wrong',
        error: error.message,
      })
    }
  }

  /**
   * Logout admin
   */
  async logout({ response }: HttpContext) {
    // With JWT, logout is handled client-side by removing the token
    // Optionally, you could implement a token blacklist here
    return response.json({
      message: 'Logged out successfully',
    })
  }

  /**
   * Check if user has valid token and return user info (/api/me endpoint)
   */
  async me({ admin, response }: HttpContext) {
    try {
      if (!admin) {
        return response.status(401).json({
          message: 'Unauthorized - Invalid or missing token',
        })
      }

      return response.json({
        message: 'Token is valid',
        user: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Something went wrong',
        error: error.message,
      })
    }
  }

  /**
   * Get current admin profile
   */
  async profile({ admin, response }: HttpContext) {
    try {
      if (!admin) {
        return response.status(401).json({
          message: 'Unauthorized',
        })
      }

      return response.json({
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Something went wrong',
        error: error.message,
      })
    }
  }

  /**
   * Update admin profile
   */
  async updateProfile({ admin, request, response }: HttpContext) {
    try {
      if (!admin) {
        return response.status(401).json({
          message: 'Unauthorized',
        })
      }

      const payload = await request.validateUsing(updateProfileValidator)
      const { fullName, email } = payload

      // Check if email is already taken by another admin
      if (email && email !== admin.email) {
        const existingAdmin = await Admin.findBy('email', email)
        if (existingAdmin) {
          return response.status(400).json({
            message: 'Email is already taken',
          })
        }
      }

      // Update admin
      admin.merge({ fullName, email })
      await admin.save()

      return response.json({
        message: 'Profile updated successfully',
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Something went wrong',
        error: error.message,
      })
    }
  }

  /**
   * Change password
   */
  async changePassword({ admin, request, response }: HttpContext) {
    try {
      if (!admin) {
        return response.status(401).json({
          message: 'Unauthorized',
        })
      }

      const payload = await request.validateUsing(changePasswordValidator)
      const { currentPassword, newPassword } = payload

      // Verify current password
      const isValid = await hash.verify(admin.password, currentPassword)

      if (!isValid) {
        return response.status(400).json({
          message: 'Current password is incorrect',
        })
      }

      // Update password
      admin.password = newPassword
      await admin.save()

      return response.json({
        message: 'Password changed successfully',
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Something went wrong',
        error: error.message,
      })
    }
  }
}
