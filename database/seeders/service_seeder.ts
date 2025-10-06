import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Service from '#models/service'
import fs from 'node:fs'
import path from 'node:path'

export default class ServiceSeeder extends BaseSeeder {
  public async run() {
    // Avoid duplicating data if services already exist
    const existing = await Service.query().limit(1)

    if (existing.length > 0) {
      console.log('Services already exist, skipping seeding')
      return
    }

    const filePath = path.join(process.cwd(), 'services.json')

    let raw = ''
    try {
      raw = fs.readFileSync(filePath, 'utf-8')
    } catch (err) {
      console.error('Could not read services.json at', filePath)
      console.error(String(err))
      return
    }

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      console.error('Invalid JSON in services.json')
      console.error(String(err))
      return
    }

    const services: any[] = Array.isArray(parsed.services) ? parsed.services : []

    for (const s of services) {
      const payload = {
        name: s.name,
        slug: s.slug ?? null,
        description: s.description ?? null,
        fullDescription: s.fullDescription ?? null,
        detailedDescription: s.detailedDescription ?? null,
        whatIs: s.whatIs ?? null,
        typicalVisit: s.typicalVisit ?? null,
        category: s.category ?? 'other',
        price: s.price ?? null,
        duration: s.duration ?? null,
        services: s.services ?? null,
        gettingStartedPoints: s.gettingStartedPoints ?? null,
        stats: s.stats ?? null,
        benefits: s.benefits ?? null,
        benefitsExtended: s.benefitsExtended ?? null,
        gettingStarted: s.gettingStarted ?? null,
        image: s.image ?? null,
        icon: s.icon ?? null,
        isActive: typeof s.active === 'boolean' ? s.active : true,
      }

      // Try to find existing by slug first, then by name
      let existingSvc: any = null
      if (payload.slug) {
        existingSvc = await Service.query().where('slug', payload.slug).first()
      }

      if (!existingSvc) {
        existingSvc = await Service.query().where('name', payload.name).first()
      }

      if (existingSvc) {
        existingSvc.merge(payload)
        await existingSvc.save()
        console.log(`Updated service: ${payload.name}`)
      } else {
        await Service.create(payload)
        console.log(`Created service: ${payload.name}`)
      }
    }

    console.log(`Processed ${services.length} services from services.json`)
  }
}
