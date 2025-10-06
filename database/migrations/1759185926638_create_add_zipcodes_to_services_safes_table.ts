import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    // Check if column exists first using raw query
    const hasColumn = await this.db.rawQuery(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'services' AND column_name = 'zipcodes'"
    )

    const columnExists = hasColumn[0]?.[0]?.count > 0

    if (!columnExists) {
      this.schema.alterTable(this.tableName, (table) => {
        table.json('zipcodes').nullable()
      })
    }
  }

  async down() {
    // Check if column exists before dropping
    const hasColumn = await this.db.rawQuery(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'services' AND column_name = 'zipcodes'"
    )

    const columnExists = hasColumn[0]?.[0]?.count > 0

    if (columnExists) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('zipcodes')
      })
    }
  }
}
