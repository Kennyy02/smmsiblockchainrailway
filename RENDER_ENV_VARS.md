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
APP_KEY=base64:VUPrHts0d7taeTldTmt0FwKPtThfVvphsWlB3utG76A=
APP_NAME=Blockchain Grading System
APP_URL=https://your-service-name.onrender.com

# Database (Railway MySQL - PUBLIC URL - NOT internal!)
DB_CONNECTION=mysql
DB_HOST=yamanote.proxy.rlwy.net
DB_PORT=59154
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=QcZagiIHkFzESoouEYYHYUbDMKOECyfh

# Session & Cache
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
CACHE_DRIVER=database
QUEUE_CONNECTION=database

# Logging
LOG_CHANNEL=stderr
LOG_LEVEL=error

# Storage
FILESYSTEM_DISK=local

# Admin Account (used by admin:setup-from-env command)
ADMIN_EMAIL=admin@smms.edu.ph
ADMIN_NAME=Administrator
ADMIN_PASSWORD=admin123

# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=mumbai
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_CONTRACT_ADDRESS=0x8265CBc9a83af20b4203fb1177aDAC7564f747bD
BLOCKCHAIN_PRIVATE_KEY=bc5a13bb6d83ce4e2b89d335b367f8674ca83978a35d115cc17ccd2b949df4a5
BLOCKCHAIN_WALLET_ADDRESS=0xeC34Cb30404883b97FF18127D7C31D8F07C5D17a

# School Information
SCHOOL_NAME=Southern Mindoro Maritime School, Inc.
SCHOOL_SHORT_NAME=Southern Mindoro
SCHOOL_SUBTITLE=Maritime School, Inc.
SCHOOL_ADDRESS_CITY=Bagumbayan, Roxas
SCHOOL_ADDRESS_PROVINCE=Oriental Mindoro
SCHOOL_ADDRESS_COUNTRY=Philippines
SCHOOL_PHONE=+63 XXX XXX XXXX
SCHOOL_EMAIL=info@smms.edu.ph
SCHOOL_EMAIL_SUPPORT=support@smms.edu.ph
SCHOOL_FACEBOOK_URL=https://www.facebook.com/smmsi.shs
SCHOOL_WEBSITE_URL=https://smmsblockchain.up.railway.app/
SCHOOL_OFFICE_HOURS=Monday - Friday, 8:00 AM - 5:00 PM
SCHOOL_COPYRIGHT_YEAR=2025

# System Configuration
SYSTEM_NAME=Blockchain Grading System
```

## Important Notes:

1. **APP_URL**: Update this to your Render service URL (e.g., `https://grading-management-system.onrender.com`)

2. **APP_KEY**: The value from Railway is already included above. If you need to generate a new one:
   ```bash
   php artisan key:generate --show
   ```

3. **Database Host**: Use the PUBLIC URL (`yamanote.proxy.rlwy.net:59154`), NOT the internal one (`mysql.railway.internal:3306`)

4. **SCHOOL_WEBSITE_URL**: You may want to update this to point to your Render URL once deployed

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

