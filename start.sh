#!/bin/bash
# Startup script for Railway with PHP upload limits

# Run migrations with PHP limits
php -d upload_max_filesize=50M \
    -d post_max_size=52M \
    -d max_execution_time=300 \
    -d max_input_time=300 \
    -d memory_limit=256M \
    artisan migrate --force

# Run admin setup (if needed)
php -d upload_max_filesize=50M \
    -d post_max_size=52M \
    -d max_execution_time=300 \
    -d max_input_time=300 \
    -d memory_limit=256M \
    artisan admin:setup-from-env || true

# Start Laravel server with PHP limits
exec php -d upload_max_filesize=50M \
         -d post_max_size=52M \
         -d max_execution_time=300 \
         -d max_input_time=300 \
         -d memory_limit=256M \
         artisan serve --host=0.0.0.0 --port=$PORT

