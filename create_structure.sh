#!/bin/bash

# Define the root directory
ROOT_DIR="backend"

# Create the root directory
mkdir -p "$ROOT_DIR"
cd "$ROOT_DIR"

# Create main top-level directories and files
mkdir -p .github/workflows
mkdir -p kubernetes
mkdir -p scripts
mkdir -p nginx
mkdir -p infra/terraform infra/docs
mkdir -p src/{config,core/{errors,security,utils},middlewares,services,queues,workers,jobs,lib,utils,tests/{unit,integration}}
mkdir -p src/features/{auth,users,products,categories,cart,orders,payments,webhooks,admin,uploads,coupons,reviews,reports,notifications}

# Create specific files (using 'touch' to create empty files)
# Top Level
touch .dockerignore .env.example Dockerfile docker-compose.yml README.md package.json package-lock.json

# .github/workflows
touch .github/workflows/ci.yml .github/workflows/cd.yml

# kubernetes
touch kubernetes/deployment.yaml kubernetes/service.yaml kubernetes/ingress.yaml kubernetes/redis-deployment.yaml

# scripts
touch scripts/seed-admin.js scripts/seed-products.js scripts/start-local.sh

# nginx
touch nginx/default.conf

# infra
touch infra/terraform/main.tf infra/terraform/variables.tf
touch infra/docs/deployment.md

# src - main files
touch src/app.js src/server.js

# src/config
touch src/config/db.js src/config/env.js src/config/redis.js src/config/logger.js

# src/core/errors
touch src/core/errors/ApiError.js src/core/errors/errorHandler.js

# src/core/security
touch src/core/security/roles.js

# src/core/utils
touch src/core/utils/catchAsync.js src/core/utils/idempotency.js src/core/utils/pagination.js

# src/middlewares
touch src/middlewares/auth.js src/middlewares/admin.js src/middlewares/validate.js \
      src/middlewares/rateLimiter.js src/middlewares/requestLogger.js src/middlewares/rawBodyForWebhooks.js \
      src/middlewares/fileUpload.js

# src/services
touch src/services/mailer.service.js src/services/storage.service.js src/services/payment.service.js \
      src/services/queue.service.js src/services/cache.service.js

# src/queues
touch src/queues/index.js src/queues/orders.queue.js src/queues/emails.queue.js

# src/workers
touch src/workers/orderWorker.js src/workers/emailWorker.js

# src/jobs
touch src/jobs/webhooks.retry.job.js

# src/lib
touch src/lib/logger.js src/lib/utils.js

# src/utils
touch src/utils/validators.js

# src/tests
touch src/tests/unit/auth.test.js src/tests/unit/products.test.js src/tests/unit/orders.test.js
touch src/tests/integration/payments.integration.test.js

# Features (Using a loop for the repeating structure: .controller.js, .model.js, etc.)

# Define the features that have a full MVC/service/validation structure
FEATURES_FULL="auth users products orders"
for feature in $FEATURES_FULL; do
    touch src/features/$feature/$feature.controller.js \
          src/features/$feature/$feature.model.js \
          src/features/$feature/$feature.routes.js \
          src/features/$feature/$feature.service.js \
          src/features/$feature/$feature.validation.js
done

# Categories/Cart (No validation)
FEATURES_SIMPLE="categories cart"
for feature in $FEATURES_SIMPLE; do
    touch src/features/$feature/$feature.model.js \
          src/features/$feature/$feature.controller.js \
          src/features/$feature/$feature.routes.js \
          src/features/$feature/$feature.service.js
done

# Payments/Webhooks (No model/validation)
touch src/features/payments/payments.controller.js src/features/payments/payments.routes.js src/features/payments/payments.service.js
touch src/features/webhooks/webhooks.routes.js

# Admin (Controller/Routes only)
touch src/features/admin/admin.controller.js src/features/admin/admin.routes.js

# Uploads
touch src/features/uploads/uploads.controller.js src/features/uploads/uploads.routes.js src/features/uploads/uploads.service.js

# Coupons/Reviews
touch src/features/coupons/coupon.model.js src/features/coupons/coupon.controller.js src/features/coupons/coupon.routes.js src/features/coupons/coupon.service.js
touch src/features/reviews/review.model.js src/features/reviews/review.controller.js src/features/reviews/review.routes.js src/features/reviews/review.service.js

# Reports/Notifications (Service/Controller only)
touch src/features/reports/reports.controller.js src/features/reports/reports.service.js
touch src/features/notifications/notifications.controller.js src/features/notifications/notifications.service.js

# Optional file
touch tsconfig.json

echo "✅ Folder structure for '$ROOT_DIR' created successfully!"