import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Admin from '#models/admin'

export default class extends BaseSeeder {
  async run() {
    // Check if any admin exists
    const adminExists = await Admin.query().first()

    if (!adminExists) {
      // Create default admin
      await Admin.create({
        fullName: 'Super Admin',
        email: 'admin@onCall.com',
        password: 'admin123',
        role: 'super_admin',
        isActive: true,
      })

      console.log('Default admin created:')
      console.log('Email: admin@onCall.com')
      console.log('Password: admin123')
      console.log('Please change this password after first login!')
    }
  }
}
