# Render Deployment Troubleshooting

## Issue: "composer: command not found"

### Problem
Render is detecting your app as Node.js instead of PHP, so Composer isn't available.

### Solution 1: Use render.yaml (Recommended)

Make sure your `render.yaml` file is in the root directory and uses `runtime: php`:

```yaml
services:
  - type: web
    name: grading-management-system
    runtime: php  # This tells Render to use PHP environment
    plan: free
    # ... rest of config
```

### Solution 2: Manual Configuration in Render Dashboard

If `render.yaml` isn't being detected:

1. Go to your Render service dashboard
2. Click "Settings"
3. Scroll down to "Environment"
4. Look for "Runtime" or "Environment" setting
5. Change it from "Node" to "PHP"
6. Save changes
7. Trigger a new deployment

### Solution 3: Delete and Recreate Service

If the above doesn't work:

1. Delete the current service in Render
2. Create a new Web Service
3. When prompted for environment/runtime, select **"PHP"** (not Node.js)
4. Connect your GitHub repository
5. Render should detect PHP and make Composer available

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

