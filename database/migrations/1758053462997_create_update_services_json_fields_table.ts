import { BaseSchema } from '@adonisjs/lucid/schema'

export default class UpdateServicesJsonFields extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('services').nullable().alter()
      table.json('getting_started_points').nullable().alter()
      table.json('stats').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('services').nullable().alter()
      table.text('getting_started_points').nullable().alter()
      table.text('stats').nullable().alter()
    })
  }
}
