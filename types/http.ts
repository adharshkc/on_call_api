import Admin from '#models/admin'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    admin?: Admin
  }
}
