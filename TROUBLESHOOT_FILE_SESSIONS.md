# Troubleshooting File Sessions Not Working

If you've changed `SESSION_DRIVER=file` but still getting logged out:

## Step 1: Verify Change Took Effect

1. **Make sure you saved the environment variable** in Render Dashboard
2. **Redeploy the service** - Environment variable changes require a redeploy to take effect
3. **Clear browser cookies** again after redeploy

## Step 2: Check Sessions Directory Permissions

File sessions need the `storage/framework/sessions` directory to be writable. The Dockerfile should handle this, but let's verify.

## Step 3: Check if CACHE_DRIVER Also Needs to Change

If `CACHE_DRIVER=database` and database is failing, you might also need to change it to `file`:
- In Render: Change `CACHE_DRIVER=database` to `CACHE_DRIVER=file`

## Step 4: Check Render Logs

1. Go to Render Dashboard → Your Service → **Logs**
2. Look for errors related to sessions or file permissions
3. Check if there are any errors when trying to write session files

## Step 5: Verify Environment Variables

Make sure in Render Dashboard → Environment:
- `SESSION_DRIVER=file` (not `database`)
- `CACHE_DRIVER=file` (recommended, if database is failing)

## Common Issues

1. **Didn't redeploy** - Environment variable changes require redeploy
2. **Sessions directory not writable** - Docker container permissions issue
3. **Cache also using database** - Change CACHE_DRIVER to file too
4. **Config cached** - Laravel might have cached the old config

