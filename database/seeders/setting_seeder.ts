import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Setting from '#models/setting'

export default class extends BaseSeeder {
  async run() {
    // Create initial settings
    await Setting.updateOrCreateMany('key', [
      {
        key: 'popup_config',
        value: {
          enabled: true,
          title: 'ON CALL',
          introText: 'We care for you',
          content: 'Temporary Recruitment Agency / Staffing Solutions.',
          buttonText: 'Get Started',
          showOnce: false,
        },
        description: 'Configuration for the app popup modal',
      },
      {
        key: 'app_maintenance',
        value: {
          enabled: false,
          title: 'Maintenance Mode',
          message: 'We are currently performing maintenance. Please check back soon.',
        },
        description: 'App maintenance mode settings',
      },
      {
        key: 'app_config',
        value: {
          appName: 'Daily Care',
          version: '1.0.0',
          supportEmail: 'support@dailycare.com',
          supportPhone: '1-800-CARE',
        },
        description: 'General app configuration',
      },
    ])
  }
}
