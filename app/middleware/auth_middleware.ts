import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

// This legacy middleware isn't used. Keep a no-op to avoid type errors if referenced.
export default class AuthMiddleware {
  async handle(_ctx: HttpContext, next: NextFn) {
    return next()
  }
}
