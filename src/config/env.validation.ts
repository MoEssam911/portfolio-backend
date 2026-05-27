import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  PORT: Joi.number().default(4000),

  DIRECT_URL: Joi.string().required(),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),

  JWT_EXPIRES_IN: Joi.string().default('15m'),

  SUPABASE_URL: Joi.string().required(),

  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),

  SUPABASE_STORAGE_BUCKET: Joi.string().required(),

  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
});
