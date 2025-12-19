# Reset Admin Password Guide

If you're unable to log in as an admin due to password hashing issues (Bcrypt error), you can reset the admin password using the artisan command.

## Method 1: Using the Artisan Command (Recommended)

### Step 1: Run the command

You can run the command in two ways:

**Option A: Interactive mode (recommended for security)**
```bash
php artisan admin:reset-password --email=admin@smms.edu.ph
```

The command will:
1. Ask you to enter the new password (hidden input)
2. Ask you to confirm the new password
3. Show a confirmation prompt before resetting

**Option B: With password as option (faster, less secure)**
```bash
php artisan admin:reset-password --email=admin@smms.edu.ph --password=YourNewPassword123
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

### If the command doesn't work:

1. **Check if the user exists:**
   ```bash
   php artisan tinker
   ```
   Then:
   ```php
   \App\Models\User::where('email', 'admin@smms.edu.ph')->first();
   ```

2. **Check database connection:**
   Make sure your `.env` file has the correct database credentials.

3. **Clear cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

## Security Note

- Always use a strong password (at least 8 characters, mix of letters, numbers, and symbols)
- Change the password immediately after first login
- Never share your admin credentials

