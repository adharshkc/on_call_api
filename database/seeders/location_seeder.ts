import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Location from '#models/location'

export default class extends BaseSeeder {
  async run() {
    // Check if locations already exist
    const existingLocations = await Location.query().limit(1)

    if (existingLocations.length > 0) {
      console.log('Locations already exist, skipping seeding')
      return
    }

    // Sample UK locations with postcodes
    const locations = [
      // London areas
      { name: 'Westminster', type: 'area', region: 'england', county: 'London', postcode: 'SW1A 1AA', latitude: 51.4994, longitude: -0.1347 },
      { name: 'Camden', type: 'area', region: 'england', county: 'London', postcode: 'NW1 0DU', latitude: 51.5492, longitude: -0.1426 },
      { name: 'Greenwich', type: 'area', region: 'england', county: 'London', postcode: 'SE10 8QY', latitude: 51.4825, longitude: -0.0076 },
      { name: 'Kensington', type: 'area', region: 'england', county: 'London', postcode: 'SW7 2AZ', latitude: 51.5016, longitude: -0.1749 },
      { name: 'Shoreditch', type: 'area', region: 'england', county: 'London', postcode: 'E1 6JE', latitude: 51.5223, longitude: -0.0786 },

      // Manchester areas
      { name: 'Manchester City Centre', type: 'area', region: 'england', county: 'Greater Manchester', postcode: 'M1 1AA', latitude: 53.4794, longitude: -2.2453 },
      { name: 'Salford', type: 'city', region: 'england', county: 'Greater Manchester', postcode: 'M5 4WT', latitude: 53.4875, longitude: -2.2901 },
      { name: 'Stockport', type: 'town', region: 'england', county: 'Greater Manchester', postcode: 'SK1 3XE', latitude: 53.4106, longitude: -2.1575 },

      // Birmingham areas
      { name: 'Birmingham City Centre', type: 'area', region: 'england', county: 'West Midlands', postcode: 'B1 1BB', latitude: 52.4862, longitude: -1.8904 },
      { name: 'Edgbaston', type: 'area', region: 'england', county: 'West Midlands', postcode: 'B15 2TT', latitude: 52.4539, longitude: -1.9308 },
      { name: 'Solihull', type: 'town', region: 'england', county: 'West Midlands', postcode: 'B91 3DA', latitude: 52.4118, longitude: -1.7776 },

      // Leeds areas
      { name: 'Leeds City Centre', type: 'area', region: 'england', county: 'West Yorkshire', postcode: 'LS1 4DY', latitude: 53.8008, longitude: -1.5491 },
      { name: 'Headingley', type: 'area', region: 'england', county: 'West Yorkshire', postcode: 'LS6 1EF', latitude: 53.8198, longitude: -1.5759 },

      // Liverpool areas
      { name: 'Liverpool City Centre', type: 'area', region: 'england', county: 'Merseyside', postcode: 'L1 8JQ', latitude: 53.4084, longitude: -2.9916 },
      { name: 'Wirral', type: 'area', region: 'england', county: 'Merseyside', postcode: 'CH41 6DY', latitude: 53.3727, longitude: -3.0738 },

      // Bristol areas
      { name: 'Bristol City Centre', type: 'area', region: 'england', county: 'Bristol', postcode: 'BS1 4DJ', latitude: 51.4545, longitude: -2.5879 },
      { name: 'Clifton', type: 'area', region: 'england', county: 'Bristol', postcode: 'BS8 3JA', latitude: 51.4633, longitude: -2.6154 },

      // Sheffield areas
      { name: 'Sheffield City Centre', type: 'area', region: 'england', county: 'South Yorkshire', postcode: 'S1 1DA', latitude: 53.3811, longitude: -1.4701 },

      // Newcastle areas
      { name: 'Newcastle City Centre', type: 'area', region: 'england', county: 'Tyne and Wear', postcode: 'NE1 4ST', latitude: 54.9783, longitude: -1.6174 },

      // Oxford areas
      { name: 'Oxford City Centre', type: 'area', region: 'england', county: 'Oxfordshire', postcode: 'OX1 1DP', latitude: 51.7520, longitude: -1.2577 },

      // Cambridge areas
      { name: 'Cambridge City Centre', type: 'area', region: 'england', county: 'Cambridgeshire', postcode: 'CB2 3QH', latitude: 52.2053, longitude: 0.1218 },

      // Scotland areas
      { name: 'Edinburgh City Centre', type: 'area', region: 'scotland', county: 'Edinburgh', postcode: 'EH1 1YZ', latitude: 55.9533, longitude: -3.1883 },
      { name: 'Glasgow City Centre', type: 'area', region: 'scotland', county: 'Glasgow', postcode: 'G1 1XQ', latitude: 55.8642, longitude: -4.2518 },

      // Wales areas
      { name: 'Cardiff City Centre', type: 'area', region: 'wales', county: 'Cardiff', postcode: 'CF10 1BH', latitude: 51.4816, longitude: -3.1791 },
      { name: 'Swansea', type: 'city', region: 'wales', county: 'Swansea', postcode: 'SA1 3SN', latitude: 51.6214, longitude: -3.9436 },

      // Northern Ireland areas
      { name: 'Belfast City Centre', type: 'area', region: 'northern_ireland', county: 'Belfast', postcode: 'BT1 5GS', latitude: 54.5973, longitude: -5.9301 },
    ]

    await Location.createMany(locations.map(location => ({ ...location, isActive: true })))

    console.log(`Seeded ${locations.length} locations`)
  }
}