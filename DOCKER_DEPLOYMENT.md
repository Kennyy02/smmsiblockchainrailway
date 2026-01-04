# Docker Deployment Guide for Render

This guide explains how to deploy your Laravel application to Render using Docker.

## Files Created

1. **Dockerfile** - Multi-stage Docker build configuration
2. **.dockerignore** - Files to exclude from Docker build
3. **render.yaml** - Updated to use Docker runtime

## Steps to Deploy

### 1. Commit and Push Files

Make sure the following files are committed to your repository:
- `Dockerfile`
- `.dockerignore`
- `render.yaml` (updated)

```bash
git add Dockerfile .dockerignore render.yaml
git commit -m "Add Docker configuration for Render deployment"
git push origin main
```

### 2. Create/Update Service on Render

1. **If creating a new service:**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **Select "Docker" as the Language/Runtime**
   - Render should auto-detect the `Dockerfile`

2. **If updating existing service:**
   - Go to your service settings
   - Change the "Runtime" to "Docker" (if possible)
   - Or delete and recreate the service with Docker runtime

### 3. Configure Environment Variables

In Render Dashboard → Your Service → Environment, add:

**Required:**
```
APP_KEY=your-app-key-here
APP_URL=https://your-service-url.onrender.com
APP_ENV=production
APP_DEBUG=false
```

**Database (from Railway):**
```
DB_CONNECTION=mysql
DB_HOST=your-railway-db-host.railway.app
DB_PORT=3306
DB_DATABASE=your-database-name
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
```

**Other:**
```
SESSION_DRIVER=database
CACHE_DRIVER=database
QUEUE_CONNECTION=database
LOG_CHANNEL=stderr
LOG_LEVEL=error
```

### 4. Deploy

- Render will automatically build and deploy when you push to your main branch
- Or click "Manual Deploy" → "Deploy latest commit"

## How the Dockerfile Works

### Stage 1: Builder
- Uses `php:8.2-fpm-alpine` as base
- Installs PHP extensions, Node.js, Composer
- Installs PHP and Node dependencies
- Builds frontend assets with `npm run build`

### Stage 2: Production
- Uses `php:8.2-cli-alpine` (smaller, no FPM)
- Copies built application from builder stage
- Sets up storage directories with correct permissions
- Creates start script that:
  1. Runs migrations
  2. Creates storage link
  3. Starts PHP built-in server on port specified by `$PORT`

## Troubleshooting

### Build Fails with "composer: command not found"
- Make sure you selected "Docker" as the runtime, not "Node"
- Check that Dockerfile is in the root directory

### Build Takes Too Long
- The `.dockerignore` file excludes `node_modules` and `vendor` to speed up builds
- Build uses multi-stage build to keep final image small

### Application Doesn't Start
- Check logs in Render Dashboard
- Verify environment variables are set correctly
- Make sure `APP_KEY` is set (generate with `php artisan key:generate`)

### Database Connection Issues
- Verify database credentials from Railway
- Check that Railway database is accessible from Render
- Make sure `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` are correct

### Port Issues
- Render automatically sets `$PORT` environment variable
- The Dockerfile uses this port (defaults to 8080 if not set)
- No need to configure port manually

## Notes

- The Dockerfile uses PHP's built-in server for simplicity
- For production with high traffic, consider using PHP-FPM + Nginx (requires additional configuration)
- Storage is ephemeral on Render free tier - files will be lost on redeploy
- Consider using external storage (S3, etc.) for file uploads if needed

