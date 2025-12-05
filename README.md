# Zaynarah Backend (Feature-based, enterprise skeleton)

## Quick start

1. copy .env.example -> .env and fill values
2. docker-compose up -d (optionally start redis/mongo) or run local mongod & redis
3. npm install
4. npm run dev
5. seed admin: npm run seed

## Notes

- Stripe & Razorpay require webhooks: use ngrok to expose /api/webhooks/stripe and /api/webhooks/razorpay
- Redis required for queues and idempotency (recommended)
