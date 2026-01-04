# How to Check Render Logs for Actual Error

The 500 error page doesn't show the actual error. You need to check the logs.

## Steps:

1. **Go to Render Dashboard**
2. **Click on your service** (`smmsiblockchain`)
3. **Click "Logs" tab** (in the left sidebar, NOT "Events")
4. **Scroll to the bottom** (most recent logs)
5. **Look for red error messages**

You should see something like:
```
production.ERROR: SQLSTATE[HY000] [1045] Access denied...
```

This will tell us the actual error.

## Alternative: Temporarily Enable Debug Mode

If you want to see errors on the page itself (NOT recommended for production, but helpful for debugging):

1. Go to Render Dashboard → Your Service → **Environment**
2. Change `APP_DEBUG=false` to `APP_DEBUG=true`
3. Save and redeploy
4. Visit your site - you'll see detailed error messages
5. **Remember to set it back to `false` after debugging!**

## Quick Workaround: Switch to File Sessions

While we debug the database issue, we can temporarily use file-based sessions so the app can at least run:

In Render → Environment, change:
```
SESSION_DRIVER=file
CACHE_DRIVER=file
```

This will let the app run without database connection (but some features won't work).

