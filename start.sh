#!/bin/bash
# Startup script for Railway with PHP upload limits

# Ensure storage directories exist (important for Railway volume persistence)
mkdir -p storage/app/public/course_materials
mkdir -p storage/framework/{sessions,views,cache,testing}
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Set proper permissions
chmod -R 775 storage bootstrap/cache || true

# Create storage link if it doesn't exist (for public file access)
# This links public/storage to storage/app/public
php artisan storage:link || true

# Run migrations with PHP limits
php -d upload_max_filesize=10M \
    -d post_max_size=12M \
    -d max_execution_time=300 \
    -d max_input_time=300 \
    -d memory_limit=256M \
    artisan migrate --force

# Run admin setup (if needed)
php -d upload_max_filesize=10M \
    -d post_max_size=12M \
    -d max_execution_time=300 \
    -d max_input_time=300 \
    -d memory_limit=256M \
    artisan admin:setup-from-env || true

# Start Laravel server with PHP limits
# Files stored in storage/app/public will persist in Railway volume
exec php -d upload_max_filesize=10M \
         -d post_max_size=12M \
         -d max_execution_time=300 \
         -d max_input_time=300 \
         -d memory_limit=256M \
         artisan serve --host=0.0.0.0 --port=$PORT

