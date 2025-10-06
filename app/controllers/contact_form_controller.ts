import type { HttpContext } from '@adonisjs/core/http'
import { contactFormValidator, contactEditValidator } from '#validators/contact'
import Contact from '#models/contact'
import { DateTime } from 'luxon'
import env from '#start/env'
import nodemailer from 'nodemailer'

export default class ContactFormController {
  /**
   * Public: Submit contact form with reCAPTCHA and email notification
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(contactFormValidator)

      const { recaptchaToken, ...form } = payload as any

      // Temporarily disabling reCAPTCHA verification for development / testing.
      // To re-enable, uncomment the block below and ensure RECAPTCHA_SECRET_KEY is set.
      /*
      if (!recaptchaToken) {
        return response.status(400).json({ message: 'reCAPTCHA token is missing.' })
      }

      const secretKey = env.get('RECAPTCHA_SECRET_KEY')
      const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`
      const verificationResponse = await fetch(verificationURL, { method: 'POST' })
      const verificationData = (await verificationResponse.json()) as ReCaptchaVerificationResponse

      if (!verificationData.success || (verificationData.score ?? 0) < 0.5) {
        return response
          .status(400)
          .json({ message: 'reCAPTCHA verification failed. You might be a bot.' })
      }
      */

      const contact = await Contact.create({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        serviceType: form.serviceType,
        message: form.message,
        status: 'view',
      })

      // Try to send email but don't block the response longer than 2s.
      // We'll include an emailStatus in the response indicating whether
      // the mail was sent, failed, or is pending (timeout).
      const emailPromise = this.sendEmailNotification(form)
      const timeoutPromise = new Promise<string>((resolve) =>
        setTimeout(() => resolve('pending'), 2000)
      )
      const emailStatus = await Promise.race([emailPromise, timeoutPromise]).catch(() => 'failed')

      return response.status(201).json({
        message: 'Contact form submitted successfully',
        data: contact,
        emailStatus,
      })
    } catch (error: any) {
      if (error.messages) {
        return response.status(422).json({ message: 'Validation failed', errors: error.messages })
      }
      return response
        .status(400)
        .json({ message: 'Error submitting contact form', error: error.message })
    }
  }

  private async sendEmailNotification(formData: any) {
    const transporter = nodemailer.createTransport({
      host: env.get('SMTP_HOST') as string,
      port: Number.parseInt((env.get('SMTP_PORT') as string) || '587'),
      secure: env.get('SMTP_SECURE') === 'true',
      auth: {
        user: env.get('SMTP_USER') as string,
        pass: env.get('SMTP_PASS') as string,
      },
    })

    const mailOptions = {
      from: env.get('SMTP_FROM') as string,
      to: env.get('MAIL_TO_ADDRESS') as string,
      subject: `New Contact Form Submission: ${formData.serviceType}`,
      html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> ${formData.email}</p>
          <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
          <p><strong>Service Type:</strong> ${formData.serviceType}</p>
          <p><strong>Message:</strong></p>
          <p>${formData.message}</p>
          <p><em>This is an automated message. Please do not reply directly to this email.</em></p>
        `,
    }

    try {
      await transporter.sendMail(mailOptions)
      return 'sent'
    } catch (err) {
      // Log error server-side if logger exists; for now, silently return failed.
      return 'failed'
    }
  }

  /**
   * Admin: Paginated list
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = Number.parseInt(request.qs().page || '1')
      const perPage = Number.parseInt(request.qs().per_page || '10')
      const contacts = await Contact.query()
        .whereNull('deletedAt')
        .orderBy('createdAt', 'desc')
        .paginate(page, perPage)
      return response.json({ message: 'Contacts fetched successfully', ...contacts.serialize() })
    } catch (error: any) {
      return response
        .status(500)
        .json({ message: 'Failed to fetch contacts', error: error.message })
    }
  }

  /**
   * Admin: full list (no pagination)
   */
  async full({ response }: HttpContext) {
    try {
      const contacts = await Contact.query().whereNull('deletedAt').orderBy('createdAt', 'desc')
      return response.json({ message: 'All contacts fetched successfully', data: contacts })
    } catch (error: any) {
      return response
        .status(500)
        .json({ message: 'Failed to fetch all contacts', error: error.message })
    }
  }

  /** Count */
  async count({ response }: HttpContext) {
    try {
      const total = await Contact.query().whereNull('deletedAt').count('* as total').first()
      const count = total ? Number.parseInt(total.$extras.total, 10) : 0
      return response.json({
        message: 'Total contacts count fetched successfully',
        data: { total: count },
      })
    } catch (error: any) {
      return response
        .status(500)
        .json({ message: 'Failed to fetch total contacts count', error: error.message })
    }
  }

  /** Show */
  async show({ params, response }: HttpContext) {
    try {
      const contact = await Contact.findOrFail(params.id)
      return response.json({ message: 'Contact fetched successfully', data: contact })
    } catch {
      return response.status(404).json({ message: `Contact with id ${params.id} not found` })
    }
  }

  /** Update */
  async update({ params, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(contactEditValidator)
      const contact = await Contact.findOrFail(params.id)

      const updatedData = {
        status: payload.status,
        comment: payload.comment ?? null,
        followUpDate: payload.followUpDate ? DateTime.fromISO(payload.followUpDate) : null,
        followUpTime: payload.followUpTime ? DateTime.fromISO(payload.followUpTime) : null,
        updatedAt: DateTime.now(),
      }

      contact.merge(updatedData)
      await contact.save()

      return response.json({ message: 'Contact updated successfully', data: contact })
    } catch (error: any) {
      if (error.messages) {
        return response.status(422).json({ message: 'Validation failed', errors: error.messages })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: `Contact with id ${params.id} not found` })
      }
      return response
        .status(400)
        .json({ message: 'Failed to update contact', error: error.message })
    }
  }

  /** Destroy (soft delete) */
  async destroy({ params, response }: HttpContext) {
    try {
      const contact = await Contact.findOrFail(params.id)
      contact.deletedAt = DateTime.now()
      await contact.save()
      return response.json({ message: 'Contact deleted successfully' })
    } catch {
      return response.status(404).json({ message: `Contact with id ${params.id} not found` })
    }
  }
}
