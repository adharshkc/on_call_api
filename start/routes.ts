/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Public routes
router.get('/', async () => {
  return {
    hello: 'Daily Care Admin API',
    message: 'Server is running successfully',
  }
})

// Public service availability check (for customers) - now uses zipcode
router.post('/api/check-availability', '#controllers/services_controller.checkAvailability')

// Public contact form submission
router.post('/api/contact', '#controllers/contact_form_controller.store')

// Public services routes (index and show should be accessible without auth)
router.get('/api/services', '#controllers/services_controller.index')
router.get('/api/services/:id', '#controllers/services_controller.show')

// Admin authentication routes
router
  .group(() => {
    router.post('/login', '#controllers/admin_auths_controller.login')
    router.post('/register', '#controllers/admin_auths_controller.register')
  })
  .prefix('/api/')

// Token validation endpoint
router
  .group(() => {
    router.get('/me', '#controllers/admin_auths_controller.me')
  })
  .prefix('/api/')
  .use(middleware.auth())

// Protected admin routes
router
  .group(() => {
    router.post('/logout', '#controllers/admin_auths_controller.logout')
    router.get('/profile', '#controllers/admin_auths_controller.profile')
    router.put('/profile', '#controllers/admin_auths_controller.updateProfile')
    router.put('/change-password', '#controllers/admin_auths_controller.changePassword')

    // Location management routes
    router.get('/locations/autocomplete', '#controllers/locations_controller.autocomplete')
    router.get('/locations/postcodes', '#controllers/locations_controller.getPostcodesFromGeoapify')
    router.get('/locations/search', '#controllers/locations_controller.search')
    router.get('/locations/:id/postcodes', '#controllers/locations_controller.getPostcodes')
    router.resource('/locations', '#controllers/locations_controller')

    // Service management routes
    router.get(
      '/services/:id/availability-locations',
      '#controllers/services_controller.getAvailabilityLocations'
    )
    router.post(
      '/services/add-availability',
      '#controllers/services_controller.addAvailabilityLocations'
    )
    router.post(
      '/services/add-availability-with-postcodes',
      '#controllers/services_controller.addAvailabilityWithPostcodes'
    )
    router.delete(
      '/services/availability/:availabilityId',
      '#controllers/services_controller.removeAvailabilityLocation'
    )
    // Add zipcodes to a specific service
    router.post('/services/:id/zipcodes', '#controllers/services_controller.addZipcodes')
    // Remove a specific zipcode from a service
    router.delete('/services/:id/zipcodes', '#controllers/services_controller.removeZipcode')
    // Keep create/update/delete protected; remove index/show from this resource
    router.resource('/services', '#controllers/services_controller').except(['index', 'show'])

    // Contact management routes
    router.get('/contacts', '#controllers/contact_form_controller.index')
    router.get('/contacts/full', '#controllers/contact_form_controller.full')
    router.get('/contacts/count', '#controllers/contact_form_controller.count')
    router.get('/contacts/:id', '#controllers/contact_form_controller.show')
    router.put('/contacts/:id', '#controllers/contact_form_controller.update')
    router.delete('/contacts/:id', '#controllers/contact_form_controller.destroy')
  })
  .prefix('/api/')
  .use(middleware.auth())
