import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'service_availabilities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('service_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('services')
        .onDelete('CASCADE')
      table
        .integer('location_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('locations')
        .onDelete('CASCADE')
      table.string('postcode', 20).notNullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes for better performance
      table.index(['postcode', 'service_id'])
      table.index(['service_id', 'is_active'])
      table.index(['location_id', 'service_id'])
      table.unique(['service_id', 'location_id', 'postcode'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}