import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import ServiceAvailability from '#models/service_availability'

export default class Location extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: string // 'city', 'town', 'village', 'area'

  @column()
  declare region: string // 'england', 'scotland', 'wales', 'northern_ireland'

  @column()
  declare county: string

  @column()
  declare postcode: string

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => ServiceAvailability)
  declare serviceAvailabilities: HasMany<typeof ServiceAvailability>
}
