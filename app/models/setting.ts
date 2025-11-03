import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Setting extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column({
    prepare: (value: any) => {
      // If it's already a string, assume it's JSON and return as-is
      if (typeof value === 'string') {
        return value
      }
      // Otherwise, stringify it
      return JSON.stringify(value)
    },
    consume: (value: any) => {
      // If value is null or undefined, return null
      if (value === null || value === undefined) {
        return null
      }
      // If it's already an object, return it as-is
      if (typeof value === 'object') {
        return value
      }
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch (error) {
          // If parsing fails, return the string as-is
          return value
        }
      }
      // For any other type, return as-is
      return value
    },
  })
  declare value: any

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Helper method to get a setting by key
   */
  static async get(key: string): Promise<any | null> {
    const setting = await this.findBy('key', key)
    return setting?.value || null
  }

  /**
   * Helper method to set a setting
   */
  static async set(key: string, value: any, description?: string): Promise<Setting> {
    const setting = await this.findBy('key', key)
    
    if (setting) {
      setting.value = value
      if (description) setting.description = description
      await setting.save()
      return setting
    }

    return await this.create({ key, value, description })
  }
}
