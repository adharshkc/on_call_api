import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type ContactStatus =
  | 'view'
  | 'opened'
  | 'replayed'
  | 'need follow up'
  | 'follow up scheduled'
  | 'closed'

export default class Contact extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare serviceType: string

  @column()
  declare message: string

  @column()
  declare status: ContactStatus

  @column()
  declare comment: string | null

  @column.dateTime({ serializeAs: 'followUpDate' })
  declare followUpDate: DateTime | null

  @column.dateTime({ serializeAs: 'followUpTime' })
  declare followUpTime: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}
