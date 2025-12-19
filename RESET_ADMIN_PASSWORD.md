# Reset Admin Password Guide

If you're unable to log in as an admin due to password hashing issues (Bcrypt error), you can reset the admin password using the artisan command.

## Method 1: Using the Artisan Command (Recommended)

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

**Option B: Using Railway Web Interface**

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Deployments" tab
4. Click on the latest deployment
5. Click "View Logs" or use the "Shell" option
6. Run the command:
   ```bash
   php artisan admin:reset-password --email=admin@smms.edu.ph
   ```

### Step 2: Log in with the new password

After resetting, you can log in with:
- **Email:** `admin@smms.edu.ph` (or your admin email)
- **Password:** The new password you just set

## Method 2: Using Tinker (Alternative)

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

### Error: "No connection could be made because the target machine actively refused it"

**This means you're trying to run the command locally, but your database is on Railway.**

**Solution:** Run the command on Railway using one of the methods above, not on your local machine.

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

