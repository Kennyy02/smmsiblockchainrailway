#!/bin/bash
# Startup script for Railway with PHP upload limits

# Set PHP configuration via environment variables (if supported)
export PHP_INI_SCAN_DIR="/etc/php:/usr/local/etc/php"

# Start PHP with explicit limits
exec php -d upload_max_filesize=50M \
         -d post_max_size=52M \
         -d max_execution_time=300 \
         -d max_input_time=300 \
         -d memory_limit=256M \
         artisan serve --host=0.0.0.0 --port=$PORT

