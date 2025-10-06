import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'locations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 255).notNullable()
      table.string('type', 50).notNullable() // 'city', 'town', 'village', 'area'
      table.string('region', 100).notNullable() // 'england', 'scotland', 'wales', 'northern_ireland'
      table.string('county', 100).nullable()
      table.string('postcode', 20).notNullable()
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes for better performance
      table.index(['name', 'region'])
      table.index(['postcode'])
      table.index(['region', 'is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}