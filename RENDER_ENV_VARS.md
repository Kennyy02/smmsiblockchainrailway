# Environment Variables for Render Deployment

## Database Configuration (from Railway)

Since Render is **external** to Railway, you must use the **PUBLIC URL**, not the internal one.

### Database Variables for Render Dashboard:

```
DB_CONNECTION=mysql
DB_HOST=yamanote.proxy.rlwy.net
DB_PORT=59154
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=QcZagiIHkFzESoouEYYHYUbDMKOECyfh
```

**Important Notes:**
- Use `MYSQL_PUBLIC_URL` host: `yamanote.proxy.rlwy.net`
- Use `MYSQL_PUBLIC_URL` port: `59154` (NOT 3306 - that's for internal connections)
- Do NOT use `mysql.railway.internal` - that only works inside Railway

### Full Environment Variables for Render:

```
# Application
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_URL=https://your-service-name.onrender.com

# Database (Railway MySQL - PUBLIC URL)
DB_CONNECTION=mysql
DB_HOST=yamanote.proxy.rlwy.net
DB_PORT=59154
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=QcZagiIHkFzESoouEYYHYUbDMKOECyfh

# Session & Cache
SESSION_DRIVER=database
CACHE_DRIVER=database
QUEUE_CONNECTION=database

# Logging
LOG_CHANNEL=stderr
LOG_LEVEL=error

# Storage
FILESYSTEM_DISK=local
```

## How to Get APP_KEY:

If you don't have an `APP_KEY` yet, generate it locally:

```bash
php artisan key:generate --show
```

Copy the output (starts with `base64:`) and use it as `APP_KEY` in Render.

## Quick Reference from Railway:

| Railway Variable | Value for Render | Notes |
|-----------------|------------------|-------|
| `MYSQL_PUBLIC_URL` | Parse this: `mysql://root:PASSWORD@yamanote.proxy.rlwy.net:59154/railway` | Use HOST, PORT, DATABASE from this |
| `MYSQL_ROOT_PASSWORD` | Use as `DB_PASSWORD` | `QcZagiIHkFzESoouEYYHYUbDMKOECyfh` |
| `MYSQL_DATABASE` | Use as `DB_DATABASE` | `railway` |
| `MYSQLUSER` | Use as `DB_USERNAME` | `root` |

**DO NOT USE:**
- `MYSQL_URL` (internal URL - won't work from Render)
- `MYSQLHOST` (internal host - `mysql.railway.internal`)
- `MYSQLPORT` (internal port - `3306`)

