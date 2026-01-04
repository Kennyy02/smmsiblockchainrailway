# Fix: Automatic Logout After Login

## The Problem
After logging in, you're immediately logged out. This happens because sessions are stored in the database (`SESSION_DRIVER=database`), but the database connection is failing.

## Root Cause
1. Sessions are configured to use database storage
2. Database connection to Railway is failing (authentication errors we saw earlier)
3. When you log in, Laravel tries to save the session to the database
4. Database write fails → session isn't saved
5. Next request → no session found → you're logged out

## Temporary Fix: Switch to File-Based Sessions

Until the database connection is fixed, you can temporarily use file-based sessions:

### On Render Dashboard:
1. Go to your service → **Environment** tab
2. Change `SESSION_DRIVER=database` to `SESSION_DRIVER=file`
3. Save and redeploy

This will allow you to log in and use the system while we fix the database connection.

## Permanent Fix: Fix Database Connection

The real issue is that the database connection to Railway is failing. You need to:

1. **Verify Railway database is running**
2. **Check database credentials in Render match Railway exactly**
3. **Test database connection**

Once the database connection works, you can switch back to `SESSION_DRIVER=database`.

## Why File Sessions Work

File sessions store session data in files on the server (`storage/framework/sessions`), so they don't require a database connection. This is a good temporary solution.

## After Database is Fixed

Once the database connection is working:
1. Change `SESSION_DRIVER=file` back to `SESSION_DRIVER=database`
2. Redeploy
3. Sessions will be stored in the database again

