# Admin Account Setup & Password Reset Guide

This guide covers multiple ways to set up or reset your admin account, including using environment variables for easy configuration in Railway.

## Method 1: Using Environment Variables (Recommended for Railway)

This is the easiest method for Railway deployments. Set the admin credentials as environment variables, and the system will automatically create or update the admin account.

### Step 1: Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your **web service**
3. Go to the **"Variables"** tab
4. Add the following variables:

   ```
   ADMIN_EMAIL=admin@smms.edu.ph
   ADMIN_PASSWORD=YourSecurePassword123
   ADMIN_NAME=Administrator
   ```

   **Note:** 
   - `ADMIN_EMAIL` is required
   - `ADMIN_PASSWORD` is required (must be at least 8 characters)
   - `ADMIN_NAME` is optional (defaults to "Administrator")

### Step 2: Run the Setup Command

**Option A: Via Railway Web Interface Shell (Recommended)**

1. Go to Railway dashboard → Your web service → Deployments → Latest deployment
2. Open the **"Shell"** or **"Terminal"** option
3. Run:
   ```bash
   php artisan admin:setup-from-env
   ```

**Option B: Add to Start Command (One-time setup)**

You can also add this to your Railway start command temporarily:

```bash
php artisan admin:setup-from-env && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
```

**Important:** Remove `php artisan admin:setup-from-env &&` from the start command after the first run, or it will reset the password on every deployment.

### Step 3: Log in

After running the command, you can log in with:
- **Email:** The value you set in `ADMIN_EMAIL`
- **Password:** The value you set in `ADMIN_PASSWORD`

### Benefits of This Method

- ✅ Easy to configure in Railway's Variables section
- ✅ No need to remember commands
- ✅ Can be automated in deployment
- ✅ Works even if you can't log in
- ✅ Automatically creates admin if it doesn't exist
- ✅ Updates existing admin if it does exist

## Method 2: Using the Artisan Command (Manual Reset)

### ⚠️ Important: Run on Railway, Not Locally

Since your application is deployed on Railway, you need to run this command on the Railway server, not on your local machine.

### Step 1: Run the command on Railway

**Option A: Using Railway CLI (Recommended)**

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```
   (Select your project when prompted)

4. **Run the command**:
   
   **Interactive mode (recommended for security):**
   ```bash
   railway run php artisan admin:reset-password --email=admin@smms.edu.ph
   ```
   
   **Or with password as option:**
   ```bash
   railway run php artisan admin:reset-password --email=admin@smms.edu.ph --password=YourNewPassword123
   ```

**Option B: Using Railway Web Interface (Recommended for this case)**

The `railway run` command runs locally with Railway's environment variables, but can't access Railway's internal network. Use the web interface instead:

1. Go to https://railway.app/ and open your project
2. Click on your **web service** (not the database)
3. Go to the **"Deployments"** tab
4. Click on the **latest deployment**
5. Look for a **"Shell"** or **"Terminal"** button/tab (this opens a shell directly on Railway's server)
6. In the Railway shell, run:
   ```bash
   php artisan admin:reset-password --email=admin@smms.edu.ph
   ```

**Note:** The Railway web shell runs directly on Railway's servers, so it can access the internal database hostname `mysql.railway.internal`.

### Step 2: Log in with the new password

After resetting, you can log in with:
- **Email:** `admin@smms.edu.ph` (or your admin email)
- **Password:** The new password you just set

## Method 3: Using Tinker (Alternative)

If you prefer to use Laravel Tinker:

```bash
php artisan tinker
```

Then run:
```php
$user = \App\Models\User::where('email', 'admin@smms.edu.ph')->first();
$user->password = \Illuminate\Support\Facades\Hash::make('YourNewPassword123');
$user->save();
exit
```

## Troubleshooting

### Error: "getaddrinfo for mysql.railway.internal failed: No such host is known"

**This happens when using `railway run` - it runs locally with Railway's env vars but can't access Railway's internal network.**

**Solution:** Use Railway's **web interface shell** instead (Option B above). The web shell runs directly on Railway's servers and can access the internal database.

### Error: "No connection could be made because the target machine actively refused it"

**This means you're trying to run the command locally, but your database is on Railway.**

**Solution:** Run the command on Railway using the web interface shell (Option B), not on your local machine.

### If the command doesn't work on Railway:

1. **Check if the user exists:**
   ```bash
   railway run php artisan tinker
   ```
   Then:
   ```php
   \App\Models\User::where('email', 'admin@smms.edu.ph')->first();
   exit
   ```

2. **Check database connection on Railway:**
   - Go to Railway dashboard → Your project → Variables
   - Ensure `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` are set correctly
   - Railway should auto-populate these when you add a MySQL database

3. **Clear cache on Railway:**
   ```bash
   railway run php artisan config:clear
   railway run php artisan cache:clear
   ```

### Running Locally (for Development Only)

If you want to run this locally for development, you need to:
1. Start your local MySQL server
2. Ensure your `.env` file has the correct local database credentials
3. Then run: `php artisan admin:reset-password --email=admin@smms.edu.ph`

## Security Note

- Always use a strong password (at least 8 characters, mix of letters, numbers, and symbols)
- Change the password immediately after first login
- Never share your admin credentials

