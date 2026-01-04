# Database Connection Troubleshooting for Render

## Error: Access denied for user 'root'@'100.64.0.2'

This error means Laravel can't authenticate to your Railway MySQL database from Render.

## Step 1: Verify Environment Variables in Render

Go to **Render Dashboard → Your Service → Environment** and verify these variables are set **exactly** as shown:

### Required Database Variables:

```
DB_CONNECTION=mysql
DB_HOST=yamanote.proxy.rlwy.net
DB_PORT=59154
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=QcZagiIHkFzESoouEYYHYUbDMKOECyfh
```

### Common Mistakes:

1. **Extra spaces** - Make sure there are NO spaces around the `=` sign
   - ❌ Wrong: `DB_HOST = yamanote.proxy.rlwy.net`
   - ✅ Correct: `DB_HOST=yamanote.proxy.rlwy.net`

2. **Missing variables** - All 6 variables must be set
   - `DB_CONNECTION`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_DATABASE`
   - `DB_USERNAME`
   - `DB_PASSWORD`

3. **Wrong port** - Make sure you're using the PUBLIC port (59154), not the internal port (3306)

4. **Wrong host** - Make sure you're using the PUBLIC host (`yamanote.proxy.rlwy.net`), not the internal host (`mysql.railway.internal`)

5. **Password typos** - Copy the password exactly from Railway

## Step 2: Verify Railway Database is Accessible

1. Go to **Railway Dashboard → Your Database → Settings**
2. Make sure **"Public Networking"** is enabled (should be ON by default)
3. Check that the database is running (not paused)

## Step 3: Test Connection from Render

After updating environment variables in Render:

1. **Redeploy** your service (or wait for auto-deploy)
2. Check the logs in Render Dashboard → Your Service → Logs
3. Look for migration output - it should show successful connection

## Step 4: Verify Connection String

From Railway, your connection string should be:
```
mysql://root:QcZagiIHkFzESoouEYYHYUbDMKOECyfh@yamanote.proxy.rlwy.net:59154/railway
```

Breaking this down:
- **Protocol**: `mysql://`
- **Username**: `root`
- **Password**: `QcZagiIHkFzESoouEYYHYUbDMKOECyfh`
- **Host**: `yamanote.proxy.rlwy.net`
- **Port**: `59154`
- **Database**: `railway`

## Step 5: Double-Check Each Variable

In Render Dashboard, click on each environment variable and verify:

| Variable | Expected Value | Check |
|----------|---------------|-------|
| `DB_CONNECTION` | `mysql` | ✅ |
| `DB_HOST` | `yamanote.proxy.rlwy.net` | ✅ |
| `DB_PORT` | `59154` | ✅ (NOT 3306) |
| `DB_DATABASE` | `railway` | ✅ |
| `DB_USERNAME` | `root` | ✅ |
| `DB_PASSWORD` | `QcZagiIHkFzESoouEYYHYUbDMKOECyfh` | ✅ (exact match) |

## Step 6: Clear Laravel Cache (After Fixing Variables)

After updating environment variables, you may need to clear Laravel's config cache:

1. Go to Render Dashboard → Your Service → Shell
2. Run: `php artisan config:clear`
3. Or redeploy the service (this will clear cache automatically)

## Quick Copy-Paste for Render Environment Variables

Copy these exactly (no spaces around `=`):

```
DB_CONNECTION=mysql
DB_HOST=yamanote.proxy.rlwy.net
DB_PORT=59154
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=QcZagiIHkFzESoouEYYHYUbDMKOECyfh
```

## Still Not Working?

If you've verified everything above and it's still not working:

1. **Check Railway Database Status** - Make sure the database is running (not paused/sleeping)
2. **Check Railway Logs** - See if there are connection attempts being blocked
3. **Verify Password** - Try copying the password from Railway again (in case it changed)
4. **Check Render Logs** - Look for more detailed error messages

## Note About Railway Free Tier

Railway databases on the free tier may have connection limits. If you see "too many connections" errors, consider:
- Checking if multiple services are connecting
- Restarting the Railway database
- Upgrading Railway plan if needed

