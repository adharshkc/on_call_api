import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contacts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name', 100).notNullable()
      table.string('email', 255).notNullable()
      table.string('phone', 50).nullable()
      table.string('service_type', 100).notNullable()
      table.text('message').notNullable()
      table
        .enum(
          'status',
          ['view', 'opened', 'replayed', 'need follow up', 'follow up scheduled', 'closed'],
          {
            useNative: false,
            enumName: 'contact_status_enum',
          }
        )
        .notNullable()
        .defaultTo('view')
      table.text('comment').nullable()
      table.timestamp('follow_up_date').nullable()
      table.timestamp('follow_up_time').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.index(['email'])
      table.index(['status'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
