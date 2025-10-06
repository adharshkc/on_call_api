/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring JWT authentication
  |----------------------------------------------------------
  */
  JWT_SECRET: Env.schema.string(),
  JWT_EXPIRES_IN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | reCAPTCHA & SMTP
  |----------------------------------------------------------
  */
  RECAPTCHA_SECRET_KEY: Env.schema.string.optional(),
  RECAPTCHA_BYPASS: Env.schema.string.optional(),
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.string.optional(),
  SMTP_SECURE: Env.schema.string.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASS: Env.schema.string.optional(),
  SMTP_FROM: Env.schema.string.optional(),
  MAIL_TO_ADDRESS: Env.schema.string.optional(),
  /*
  |----------------------------------------------------------
  | Geoapify configuration
  |----------------------------------------------------------
  */
  GEOAPIFY_API_KEY: Env.schema.string.optional(),
  GEOAPIFY_BASE_URL: Env.schema.string.optional(),
})
