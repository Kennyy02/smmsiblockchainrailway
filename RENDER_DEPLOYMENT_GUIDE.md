# Render Deployment Guide (Database on Railway)

This guide explains how to deploy your Laravel application to Render while keeping your database on Railway.

## Prerequisites

1. **Render Account**: Sign up at https://render.com/
2. **Railway Database**: Your MySQL database should be running on Railway
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Prepare Your Railway Database

### 1.1 Get Database Connection Details

From your Railway database service, get the following information:
- **Database Host** (MYSQLHOST)
- **Database Port** (MYSQLPORT - usually 3306)
- **Database Name** (MYSQLDATABASE)
- **Database Username** (MYSQLUSER)
- **Database Password** (MYSQLPASSWORD)

**Note:** Railway provides these in the "Variables" tab of your database service.

### 1.2 Create Public Database URL (Optional but Recommended)

Railway databases are private by default. You have two options:

**Option A: Use Railway's Public Network** (Recommended)
1. Go to your Railway database service
2. Click "Settings" → "Networking"
3. Enable "Public Networking"
4. Copy the public database URL

**Option B: Use Railway's Private Network** (More Secure)
- Keep database private and use Railway's private networking
- Render can connect if both are on the same network (not applicable for cross-platform)

## Step 2: Deploy to Render

### 2.1 Create New Web Service on Render

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your repository

### 2.2 Configure Build Settings

**Important:** Make sure Render detects this as a PHP application, not Node.js!

Render will detect the `render.yaml` file automatically. If you need to configure manually:

**Runtime/Environment:** Select **"PHP"** (not Node.js!)

**Build Command:**
```bash
composer install --no-dev --optimize-autoloader --no-scripts && npm install && npm run build && php artisan config:clear && php artisan cache:clear
```

**Start Command:**
```bash
php artisan migrate --force && php artisan storage:link && php -S 0.0.0.0:$PORT -t public
```

**Note:** The `render.yaml` file already specifies `runtime: php`, which should set this correctly. If Render still detects Node.js, manually select "PHP" in the dashboard.

### 2.3 Configure Environment Variables

In the Render dashboard, go to "Environment" and add these variables:

#### Required Variables:

```env
# App Configuration
APP_NAME="Blockchain Grading System"
APP_ENV=production
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://your-app.onrender.com

# Database (From Railway)
DB_CONNECTION=mysql
DB_HOST=your-railway-db-host.railway.app
DB_PORT=3306
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=your-railway-db-password

# Session & Cache
SESSION_DRIVER=database
CACHE_DRIVER=database
QUEUE_CONNECTION=database

# Filesystem
FILESYSTEM_DISK=local

# Logging
LOG_CHANNEL=stderr
LOG_LEVEL=error
```

#### Generate APP_KEY

Run this locally to generate your APP_KEY:
```bash
php artisan key:generate --show
```

Copy the output and use it for `APP_KEY`.

#### Database Connection String Format

For Railway databases with public networking enabled, use:
```
DB_HOST=your-service-name.up.railway.app
DB_PORT=3306
```

For Railway databases with private networking, you'll need to use Railway's private network address.

### 2.4 Configure Database Connection

**Important:** Make sure your Railway database allows connections from Render's IP addresses, or use Railway's public networking feature.

### 2.5 Set Up Storage

Render has ephemeral storage, so files uploaded will be lost on redeploy. For production, consider:

1. **Use Database Storage** (for small files)
2. **Use Cloud Storage** (S3, DigitalOcean Spaces, etc.)
3. **Use Render Disk** (persistent storage addon)

For development/testing, the default local storage will work but files won't persist.

## Step 3: Deploy

1. Click "Create Web Service" or "Save Changes"
2. Render will automatically build and deploy your application
3. Watch the build logs for any errors
4. Once deployed, you'll get a URL like: `https://your-app.onrender.com`

## Step 4: Run Initial Setup

After deployment, you may need to run migrations manually:

1. Go to your Render service dashboard
2. Click on "Shell" tab
3. Run:
```bash
php artisan migrate --force
php artisan storage:link
```

Or use Render's "Manual Deploy" → "Run Command" feature.

## Step 5: Configure Domain (Optional)

1. Go to your Render service
2. Click "Settings" → "Custom Domain"
3. Add your custom domain
4. Follow DNS configuration instructions

## Environment Variables Reference

### Required from Railway Database:
- `DB_HOST` - Your Railway database host
- `DB_PORT` - Database port (usually 3306)
- `DB_DATABASE` - Database name
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password

### Required Application Variables:
- `APP_KEY` - Generated using `php artisan key:generate --show`
- `APP_URL` - Your Render app URL
- `APP_ENV=production`
- `APP_DEBUG=false`

### Optional but Recommended:
- `SESSION_DRIVER=database`
- `CACHE_DRIVER=database`
- `QUEUE_CONNECTION=database`
- `LOG_CHANNEL=stderr`

## Troubleshooting

### Issue 1: Database Connection Error

**Symptoms:** "SQLSTATE[HY000] [2002] Connection refused" or similar

**Solutions:**
1. Verify database credentials are correct
2. Check if Railway database has public networking enabled
3. Verify database host/port are correct
4. Check Railway database is running and accessible

### Issue 2: 500 Error

**Solutions:**
1. Check Render logs: Dashboard → Your Service → "Logs"
2. Verify `APP_KEY` is set correctly
3. Check database connection
4. Verify all environment variables are set
5. Check storage permissions (run `php artisan storage:link`)

### Issue 3: Assets Not Loading

**Solutions:**
1. Verify `APP_URL` is set correctly
2. Check that `npm run build` completed successfully
3. Clear cache: `php artisan config:clear && php artisan cache:clear`

### Issue 4: Migration Errors

**Solutions:**
1. Check database connection
2. Verify database user has proper permissions
3. Run migrations manually via Render Shell

### Issue 5: File Upload Issues

**Solutions:**
- Render has ephemeral storage, files are lost on redeploy
- Consider using cloud storage (S3, etc.) for production
- Use Render Disk addon for persistent storage

## Pricing & Free Tier

### Render Free Tier ✅ (No Payment Required)

**What's Free:**
- ✅ 750 hours/month (enough for continuous operation)
- ✅ Web service hosting
- ✅ Automatic deployments from GitHub
- ✅ HTTPS/SSL certificates
- ✅ Custom domains (free tier)
- ✅ No credit card required

**Free Tier Limitations:**
- ⚠️ **Sleep Mode**: App sleeps after 15 minutes of inactivity
- ⚠️ **Cold Starts**: First request after sleep takes 30-60 seconds to wake up
- ⚠️ **Ephemeral Storage**: Files in `storage/app` are lost on redeploy
- ⚠️ **Basic Resources**: Limited CPU/memory (usually sufficient for small apps)

**Is Free Tier Enough for You?**
- ✅ **Yes, if:** You're testing, have low traffic, or can tolerate cold starts
- ❌ **Upgrade if:** You need always-on service, high traffic, or instant responses

**Paid Options (Optional):**
- **Starter Plan**: $7/month (always-on, no sleep, better for production)
- **Professional Plan**: $25/month (better performance, more resources)

### Railway Database (Your Existing Setup)
- Keep your existing Railway database (free tier or paid, your choice)
- Database connections from Render are free (no extra charges)

## Important Notes

1. **Free Tier Sleep (No Extra Cost):** On Render's free tier, your app will sleep after 15 minutes of inactivity. The first request after sleep will be slow (30-60 seconds cold start), but it's completely free. All subsequent requests are fast until it sleeps again.

2. **Total Cost:** **$0/month** if using Render free tier + Railway database free tier. Perfect for testing and small applications!

2. **Database Access:** Make sure your Railway database is accessible from Render. Enable public networking on Railway if needed.

3. **Storage:** Render's filesystem is ephemeral. Files uploaded to `storage/app` will be lost on redeploy. Use cloud storage for production.

4. **Environment Variables:** Never commit `.env` file. Set all variables in Render dashboard.

5. **Database Migrations:** Run migrations manually after first deploy or set up a deployment hook.

## Updating Your App

After making changes:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically redeploy.

## Alternative: Full Railway Deployment

If you prefer to keep everything on Railway:
- Deploy your Laravel app on Railway (you already have the configuration)
- Keep database on Railway
- Simpler setup, everything in one place

See `RAILWAY_DEPLOYMENT_GUIDE.md` for Railway deployment instructions.

