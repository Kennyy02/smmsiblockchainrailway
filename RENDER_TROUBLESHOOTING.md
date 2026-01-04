# Render Deployment Troubleshooting

## Issue: "composer: command not found" - Render Detecting Node.js Instead of PHP

### Problem
Render is detecting your app as Node.js instead of PHP, so Composer isn't available. The logs show "Using Node.js version..." instead of PHP.

### ⚠️ IMPORTANT: render.yaml May Not Work for Existing Services

If you created the service BEFORE adding `render.yaml`, Render won't automatically use it. You need to either:
1. Manually change runtime in dashboard, OR
2. Delete and recreate the service

### Solution 1: Delete and Recreate Service (RECOMMENDED)

**This is the most reliable method:**

1. **In Render Dashboard:**
   - Go to your service
   - Click "Settings" → Scroll down → Click "Delete Service"
   - Confirm deletion

2. **Create New Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - **IMPORTANT:** When you see "Environment" or "Runtime" selection, choose **"PHP"** (NOT Node.js!)
   - Render should automatically detect `render.yaml` if it exists

3. **If render.yaml is detected:**
   - Build and start commands will be auto-filled from `render.yaml`
   - Just set your environment variables

4. **If render.yaml is NOT detected (or you want to set manually):**
   - **Build Command:**
     ```bash
     composer install --no-dev --optimize-autoloader --no-scripts && npm install && npm run build && php artisan config:clear && php artisan cache:clear
     ```
   - **Start Command:**
     ```bash
     php artisan migrate --force && php artisan storage:link && php -S 0.0.0.0:$PORT -t public
     ```

### Solution 2: Manual Runtime Change (If Available)

**Note:** This option may not be available in all Render dashboards. If you don't see it, use Solution 1.

1. Go to your Render service dashboard
2. Click "Settings"
3. Look for "Environment" or "Runtime" dropdown
4. Change from "Node" to "PHP"
5. Save changes
6. Click "Manual Deploy" → "Deploy latest commit"

### Verification

After fixing, the build logs should show:
- PHP version (e.g., "Using PHP version 8.2")
- Composer installing packages
- Not just Node.js/npm commands

## Common Render Configuration Issues

### Issue: Wrong Runtime Detected

**Symptoms:**
- "composer: command not found"
- "php: command not found"
- Build only runs npm commands

**Fix:**
- Ensure `render.yaml` has `runtime: php`
- Or manually set Runtime to PHP in dashboard

### Issue: Build Fails on npm install

**Symptoms:**
- Build fails during `npm install` or `npm run build`

**Fix:**
- This is normal - you need both PHP (Composer) AND Node.js (npm)
- Render should provide both in PHP runtime
- If not, check that both are in your build command

### Issue: Port Already in Use

**Symptoms:**
- "Address already in use" error

**Fix:**
- Make sure start command uses `$PORT` environment variable
- Render provides this automatically
- Use: `php -S 0.0.0.0:$PORT -t public`

## Quick Fix Checklist

- [ ] `render.yaml` exists in project root
- [ ] `render.yaml` has `runtime: php`
- [ ] Service is set to PHP runtime in dashboard
- [ ] Build command includes `composer install`
- [ ] Start command uses `$PORT` variable
- [ ] Environment variables are set
- [ ] Database credentials are correct

