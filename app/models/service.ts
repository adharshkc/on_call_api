import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Service extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string | null

  @column()
  declare description: string | null

  @column()
  declare fullDescription: string | null

  @column()
  declare detailedDescription: string | null

  @column()
  declare whatIs: string | null

  @column()
  declare typicalVisit: string | null

  @column()
  declare category: string

  @column()
  declare price: number | null

  @column()
  declare duration: number | null // in minutes
  @column()
  declare services: string[] | null

  @column()
  declare gettingStartedPoints: string[] | null

  @column()
  declare stats: Record<string, any>[] | null

  @column()
  declare benefits: string | null

  @column()
  declare benefitsExtended: string | null

  @column()
  declare gettingStarted: string | null

  @column()
  declare image: string | null

  @column()
  declare icon: string | null

  @column()
  declare zipcodes: string[] | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
