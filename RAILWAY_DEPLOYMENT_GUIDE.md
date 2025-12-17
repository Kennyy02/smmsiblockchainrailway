# Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app/
2. **GitHub Account**: Your code should be in a GitHub repository
3. **Database**: Railway provides MySQL/PostgreSQL

## Step 1: Prepare Your Project

### 1.1 Create necessary files

Create a `Procfile` in your project root:
```
web: php artisan serve --host=0.0.0.0 --port=$PORT
```

### 1.2 Update `composer.json`

Make sure you have this in `composer.json`:
```json
{
  "scripts": {
    "post-install-cmd": [
      "php artisan clear-compiled",
      "php artisan config:clear",
      "php artisan cache:clear"
    ]
  }
}
```

### 1.3 Create `.railwayignore` (optional)
```
node_modules/
.git/
.env
storage/logs/
```

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

## Step 3: Deploy to Railway

### 3.1 Create New Project
1. Go to https://railway.app/
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select your repository

### 3.2 Add MySQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "Add MySQL"
3. Railway will provision a MySQL database

### 3.3 Configure Environment Variables

Click on your service → "Variables" tab, and add:

```env
# App Configuration
APP_NAME="Blockchain Grading System"
APP_ENV=production
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://your-app.up.railway.app

# Database (Railway will auto-populate these)
DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_DATABASE=${{MYSQLDATABASE}}
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}

# Session & Cache
SESSION_DRIVER=database
CACHE_DRIVER=database
QUEUE_CONNECTION=database

# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=mumbai
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_CONTRACT_ADDRESS=0x8265CBc9a83af20b4203fb1177aDAC7564f747bD
BLOCKCHAIN_PRIVATE_KEY=bc5a13bb6d83ce4e2b89d335b367f8674ca83978a35d115cc17ccd2b949df4a5
BLOCKCHAIN_WALLET_ADDRESS=0xeC34Cb30404883b97FF18127D7C31D8F07C5D17a

# Mail (Optional - configure later)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Important:** Generate a new `APP_KEY`:
```bash
php artisan key:generate --show
```
Copy the output and use it for `APP_KEY`.

## Step 4: Configure Build Settings

### 4.1 Add Build Command

In Railway, go to Settings → "Build" and set:

**Build Command:**
```bash
composer install --no-dev --optimize-autoloader && npm install && npm run build && php artisan config:clear && php artisan cache:clear
```

**Start Command:**
```bash
php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
```

### 4.2 Set Root Directory (if needed)
If your Laravel app is in a subdirectory, set the root directory in Settings → "Root Directory"

## Step 5: Deploy

1. Railway will automatically deploy after you configure environment variables
2. Watch the deployment logs
3. Once deployed, you'll get a URL like: `https://your-app.up.railway.app`

## Step 6: Run Initial Setup

After first deployment, you may need to run migrations manually:

1. Go to your Railway project
2. Click on your service
3. Go to "Deployments" tab
4. Click on the latest deployment
5. Open "View Logs"
6. Or use Railway CLI to run commands

### Install Railway CLI (optional):
```bash
npm install -g @railway/cli
railway login
railway link
railway run php artisan migrate --seed
```

## Step 7: Set Up Storage

Laravel's `storage` directory needs to be writable:

1. Add a `nixpacks.toml` file to your project root:
```toml
[phases.setup]
nixPkgs = ["php82", "php82Packages.composer", "nodejs-18_x"]

[phases.install]
cmds = ["composer install --no-dev --optimize-autoloader", "npm install", "npm run build"]

[phases.build]
cmds = ["php artisan config:clear", "php artisan cache:clear"]

[start]
cmd = "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT"
```

## Troubleshooting

### Issue 1: 500 Error
**Fix:** Check logs in Railway dashboard
```bash
railway logs
```

### Issue 2: Database Connection Error
**Fix:** Make sure database variables are set correctly
- Use Railway's provided variables: `${{MYSQLHOST}}`, etc.

### Issue 3: Assets Not Loading
**Fix:** 
1. Make sure `npm run build` runs in build command
2. Check `APP_URL` is set correctly
3. Run `php artisan storage:link`

### Issue 4: Permission Errors
**Fix:** Storage permissions
```bash
chmod -R 775 storage bootstrap/cache
```

### Issue 5: APP_KEY Error
**Fix:** Generate and set APP_KEY
```bash
php artisan key:generate --show
```

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] Database tables are created (migrations ran)
- [ ] Can login as admin
- [ ] Can create certificates
- [ ] Certificate blockchain verification works
- [ ] Certificate print/download works
- [ ] All pages load correctly

## Updating Your App

After making changes:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Railway will automatically redeploy.

## Custom Domain (Optional)

1. Go to your Railway service
2. Click "Settings" → "Domains"
3. Click "Generate Domain" for a railway.app subdomain
4. Or add your custom domain

## Environment-Specific Settings

For production, consider:
- Set `APP_DEBUG=false`
- Use proper mail configuration
- Enable HTTPS (Railway provides it automatically)
- Set up proper error logging
- Configure backups for database

## Cost Estimate

Railway pricing:
- **Hobby Plan**: $5/month (500 hours of usage)
- **Pro Plan**: $20/month (unlimited usage)
- Database storage is included

## Support

- Railway Docs: https://docs.railway.app/
- Laravel Deployment: https://laravel.com/docs/deployment
- Need help? Check Railway Discord or docs

