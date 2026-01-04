# Troubleshooting 500 Server Error on Render

## Step 1: Check Render Logs

1. Go to **Render Dashboard**
2. Click on your service (`blockchain-grading-system` or `grading-management-system`)
3. Click on **"Logs"** tab (in the left sidebar or top navigation)
4. Look for **red error messages** at the bottom (most recent logs)

## Common Causes of 500 Errors:

### 1. Database Connection Issues
- **Error**: `SQLSTATE[HY000] [1045] Access denied` or `Connection refused`
- **Fix**: Verify database environment variables are correct

### 2. Missing APP_KEY
- **Error**: `No application encryption key has been specified`
- **Fix**: Make sure `APP_KEY` is set in environment variables

### 3. Storage Permissions
- **Error**: `The stream or file "/var/www/html/storage/logs/laravel.log" could not be opened`
- **Fix**: Storage directories need write permissions (should be handled by Dockerfile, but check)

### 4. Missing Migrations
- **Error**: `Table 'railway.sessions' doesn't exist` or similar
- **Fix**: Run migrations - check if migrations ran successfully

### 5. PHP Fatal Errors
- **Error**: `Fatal error: Uncaught exception...`
- **Fix**: Check for syntax errors or missing dependencies

## Step 2: Check Recent Logs

Scroll to the bottom of the logs (most recent) and look for:
- Red error messages
- Stack traces
- Exception messages
- Database errors

## Step 3: Common Quick Fixes

### If you see "APP_KEY" error:
1. Generate a new key locally:
   ```bash
   php artisan key:generate --show
   ```
2. Copy the output and update `APP_KEY` in Render
3. Redeploy

### If you see database errors:
1. Double-check all database variables in Render
2. Verify Railway database is running (not paused)
3. Test connection from local machine if possible

### If you see storage/permission errors:
The Dockerfile should handle this, but if needed:
1. Check logs for specific file/directory
2. Verify storage directories exist in container

### If you see migration errors:
1. Check if migrations ran during container start
2. Look for migration output in logs
3. Manually run migrations if needed (via Render Shell)

## Step 4: Enable Detailed Error Logging (Temporary)

If logs don't show enough detail, temporarily enable debug mode:

1. In Render → Environment Variables:
   - Set `APP_DEBUG=true` (temporarily)
   - Set `LOG_LEVEL=debug`
2. Save and redeploy
3. Check logs again - you'll see more detailed errors
4. **Remember to set `APP_DEBUG=false` back after fixing!**

## Step 5: Check Container Startup

Look in logs for:
- Container start messages
- Migration output
- Any errors during startup
- PHP server start confirmation

## Next Steps:

1. **Check the Render logs now** and look for the actual error message
2. Copy the error message from the logs
3. Share it here so we can fix the specific issue

