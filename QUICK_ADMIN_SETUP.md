# Quick Admin Setup Guide

## You've Set the Environment Variables - Now What?

If you've just set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in Railway Variables, you need to run the setup command to create/update the admin account.

## Quick Steps:

### Step 1: Use Railway CLI (Since Railway doesn't have a web shell)

Since Railway doesn't provide a web shell/terminal, use the Railway CLI:

1. **Open your terminal/command prompt** (on your local machine)
2. **Make sure you're logged in** (if not already):
   ```bash
   railway login
   ```
3. **Link to your project** (if not already linked):
   ```bash
   railway link
   ```
   Select your project when prompted.

4. **Run the command** (use the full command name):
   ```bash
   railway run php artisan admin:setup-from-env
   ```

**Note:** 
- Make sure to use the full command name: `admin:setup-from-env` (not just `admin:setup`)
- This runs the command on Railway's server, not locally, so it has access to the database
- If you get connection errors, try Option 2 (Redeploy) instead

You should see output like:

```
✓ Admin account created successfully!
  Name: Administrator
  Email: admin@smms.edu.ph
  Password: [Set from environment]
  Role: admin

You can now log in with:
  Email: admin@smms.edu.ph
  Password: [The password you set in ADMIN_PASSWORD]
```

### Step 3: Log In

Go to your login page and use:
- **Email:** `admin@smms.edu.ph` (or whatever you set in `ADMIN_EMAIL`)
- **Password:** `admin123` (or whatever you set in `ADMIN_PASSWORD`)

## Option 2: Trigger a Redeploy (Easiest - Recommended)

The command is configured to run **automatically on every deployment**. To trigger it:

1. Go to Railway → Your **System** service → **Deployments** tab
2. Click the **"Redeploy"** button (or make any code change and push to GitHub)
3. Watch the **Deploy Logs** - you should see output like:
   ```
   === Admin Setup from Environment Variables ===
   📧 Found ADMIN_EMAIL: admin@smms.edu.ph
   🔑 Found ADMIN_PASSWORD: [Set]
   ✅ Admin account created successfully!
   ```
4. Once deployment completes, the admin account will be ready

**Check the Deploy Logs** to see if the command ran successfully. Look for messages starting with:
- `=== Admin Setup from Environment Variables ===`
- `📧 Found ADMIN_EMAIL:`
- `✅ Admin account created successfully!`

If you see these messages, the admin account is ready. If not, the variables might not be set correctly or the command didn't run.

## Troubleshooting

### If the command says "ADMIN_EMAIL not set"
- Make sure you added the variables to the **System** service (web service), not the MySQL service
- Check that the variable names are exactly: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

### If you still can't log in
- Make sure the password is at least 8 characters
- Check the deployment logs to see if the command ran successfully
- Try running the command again manually via Railway shell

