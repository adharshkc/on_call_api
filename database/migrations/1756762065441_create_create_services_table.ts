import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 255).notNullable()
      table.string('slug', 255).nullable()
      table.text('description').nullable()
      table.text('full_description').nullable()
      table.text('detailed_description').nullable()
      table.text('what_is').nullable()
      table.text('typical_visit').nullable()
      table.string('category', 100).notNullable()
      table.decimal('price', 10, 2).nullable()
      table.integer('duration').nullable() // in minutes
      table.json('services').nullable()
      table.text('benefits').nullable()
      table.text('benefits_extended').nullable()
      table.text('getting_started').nullable()
      table.json('getting_started_points').nullable()
      table.string('image').nullable()
      table.string('icon').nullable()
      table.json('stats').nullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Indexes
      table.index(['name'])
      table.index(['category', 'is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
