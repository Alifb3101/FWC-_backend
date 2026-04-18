# FWC Backend

Production-oriented NestJS backend foundation for a luxury watch e-commerce platform.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Class Validator

## Project Structure

```text
src/
  common/
    decorators/
    guards/
    interfaces/
  config/
  prisma/
  modules/
    auth/
    users/
    products/
    categories/
    brands/
    cart/
    orders/
    payments/
    reviews/
    wishlist/
    admin/
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update credentials and secrets.

Required variables:

- `PORT`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## Prisma Commands

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init_foundation
```

If local DB access is not available, an initial SQL migration is already generated at `prisma/migrations/20260415_init_foundation/migration.sql`.

## Run Locally

```bash
npm install
npm run prisma:generate
npm run build
npm run start:dev
```

API base path: `/api`

## Available Public Routes

- `GET /api` (health)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile` (Bearer token)
- `GET /api/products`
- `GET /api/products/featured/list`
- `GET /api/products/:slug`
- `GET /api/categories`
- `GET /api/brands`

## Notes

- Passwords are hashed with bcrypt.
- Sensitive fields (password) are never returned in auth responses.
- Validation is globally enforced with whitelist and non-whitelisted field rejection.
- Security middleware includes `helmet` and `compression`.
