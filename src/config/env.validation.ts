import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(4000),

  DIRECT_URL: Joi.string().required(),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),

  JWT_EXPIRES_IN: Joi.string().default('7d'),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),

  CLOUDINARY_API_KEY: Joi.string().required(),

  CLOUDINARY_API_SECRET: Joi.string().required(),

  CLOUDINARY_FOLDER: Joi.string().default('portfolio/develop'),

  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Contact form email delivery (Resend). All optional — without RESEND_API_KEY
  // the contact endpoint returns delivered:false (frontend mailto: fallback).
  RESEND_API_KEY: Joi.string().allow('').optional(),

  MAIL_FROM: Joi.string().allow('').optional(),

  CONTACT_TO: Joi.string().allow('').optional(),
});
