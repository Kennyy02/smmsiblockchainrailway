# Fix Missing User Accounts

## Problem
Some students, teachers, or parents in the database don't have User accounts (for logging in). This happens when:
- Students were enrolled to classes without creating login credentials
- Records were imported or migrated without user accounts
- The system had a bug that didn't create accounts properly

## Solution
A Laravel Artisan command has been created to automatically fix this issue.

## How to Run on Railway

### Option 1: Via Railway CLI (Recommended)

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

4. **Run the command**:
   ```bash
   railway run php artisan users:create-missing
   ```

### Option 2: Via Railway Dashboard

1. Go to your Railway project dashboard
2. Click on your service (the one running Laravel)
3. Go to the "Settings" tab
4. Scroll to "Deploy Triggers" or "Custom Start Command"
5. Temporarily change the start command to:
   ```bash
   php artisan users:create-missing && php artisan serve --host=0.0.0.0 --port=$PORT
   ```
6. Redeploy the service
7. Check the deployment logs to see the results
8. **Important**: Revert the start command back to normal after it runs once

### Option 3: Via Railway Shell (If Available)

1. Go to your Railway project
2. Open the service
3. Look for a "Shell" or "Terminal" option
4. Run: `php artisan users:create-missing`

## Command Options

### Create accounts for all types (default):
```bash
php artisan users:create-missing
```

### Create accounts for students only:
```bash
php artisan users:create-missing --type=students
```

### Create accounts for teachers only:
```bash
php artisan users:create-missing --type=teachers
```

### Create accounts for parents only:
```bash
php artisan users:create-missing --type=parents
```

## What the Command Does

1. **Finds all Students/Teachers/Parents** without a `user_id`
2. **Checks if a User with that email already exists**:
   - If YES: Links the existing user account to the student/teacher/parent
   - If NO: Creates a new user account with:
     - Email: Same as student/teacher/parent email
     - Password: `password123` (default)
     - Role: `student`, `teacher`, or `parent`
     - Status: `active`
3. **Updates the record** to link it to the user account

## Default Password

All created accounts will have the default password:
```
password123
```

**⚠️ IMPORTANT:** Users should change their password on first login!

## Example Output

```
Creating missing user accounts...
Default password for all accounts: password123
Users should change their password on first login.

Found 3 student(s) without user accounts
  ✓ Created account for Ken Morante (student@smms.edu.ph)
  ✓ Created account for Catherine Grace Closa (catherinegrace@gmail.com)
  → Linked John Doe to existing user account

✓ All teachers already have user accounts
✓ All parents already have user accounts

✅ Successfully created 2 user account(s)!
```

## Future Prevention

The system has been updated so that:
- ✅ When creating students via the form → User account is created automatically
- ✅ When enrolling students to classes → User account is created if missing
- ✅ When creating teachers → User account is created automatically
- ✅ When creating parents → User account is created automatically

## Troubleshooting

### "Email already exists" error
This means a user with that email already exists. The command will link the existing user to the student/teacher/parent record.

### "Database connection error"
Make sure you're running the command on Railway where the database is accessible, not locally.

### Command not found
Make sure the file `app/Console/Commands/CreateMissingUserAccounts.php` exists in your deployment.

