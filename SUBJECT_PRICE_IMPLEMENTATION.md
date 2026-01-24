# Subject Price Implementation Guide

## Overview
This document describes the implementation of a `price` field for subjects in the Grading System. Users can now add a price to each subject (e.g., 5000 pesos) which will appear in the subject management table and can be edited through the modal.

## Changes Made

### 1. Database Migration
**File:** `database/migrations/2026_01_24_000001_add_price_to_subjects_table.php`

- Added a new migration to create the `price` column in the `subjects` table
- Column type: `decimal(10, 2)` - supports prices up to 99,999,999.99
- Default value: `0`
- Nullable: Yes (allows empty prices)

### 2. Backend - Subject Model
**File:** `app/Models/Subject.php`

Updated the model to support the price field:
- Added `'price'` to the `$fillable` array to allow mass assignment
- Added `'price' => 'decimal:2'` to the `$casts` array to properly handle decimal values

### 3. Backend - Subject Controller
**File:** `app/Http/Controllers/SubjectController.php`

Updated validation in both `store()` and `update()` methods:
- Added validation rule: `'price' => 'nullable|numeric|min:0'`
- This allows optional price entry with numeric values >= 0

### 4. Frontend - AdminSubjectService
**File:** `resources/services/AdminSubjectService.ts`

Updated TypeScript interfaces:
- Added `price?: number;` to the `Subject` interface
- Added `price?: number;` to the `SubjectFormData` interface

### 5. Frontend - Subject Page (Already Supported)
**File:** `resources/js/pages/Admin/Subjects.tsx`

The frontend code already has full support for price:
- Modal form includes a price input field with proper formatting (₱)
- Table displays the price column with peso symbol formatting
- Both add and edit operations handle the price field correctly
- Price validation and error handling already implemented

## How to Use

### Setup Steps:
1. Ensure composer dependencies are installed:
   ```bash
   composer install
   ```

2. Run the migration to add the price column:
   ```bash
   php artisan migrate --step
   ```

3. Install npm dependencies (if not already done):
   ```bash
   npm install
   ```

4. Start the development servers:
   ```bash
   # Terminal 1: Laravel backend
   php artisan serve --host=localhost --port=8000
   
   # Terminal 2: Vite frontend dev server
   npm run dev
   ```

### Adding a Subject with Price:

1. Navigate to the Subject Management page (Admin panel)
2. Click on "+ Add Subject" button
3. Fill in the form:
   - **Subject Code:** e.g., "SUBJ101"
   - **Subject Name:** e.g., "Introduction to Biology"
   - **Units:** e.g., 3
   - **Price (Optional):** e.g., 5000 (for 5000 pesos)
   - **Description (Optional):** Brief description
4. Click "Add Subject" button
5. The new subject will appear in the table with the price displayed as "₱5,000.00"

### Editing a Subject:

1. In the Subject Management table, click the pencil/edit icon (✎) next to any subject
2. The edit modal will open with all current values
3. Update the price field as needed
4. Click "Update Subject" to save changes
5. The table will refresh and show the updated price

### Viewing Subject Details:

1. Click the eye icon (👁️) next to any subject to view full details
2. The details modal displays all information including the price

## Features

### Frontend Features (Already Working):
- ✅ Add new subjects with optional price
- ✅ Edit existing subjects and update price
- ✅ View subject details including price
- ✅ Delete subjects
- ✅ Search/filter subjects
- ✅ Display price in table with peso formatting
- ✅ Responsive design for mobile and desktop
- ✅ Error handling and validation feedback
- ✅ Success/error notifications

### Backend Features:
- ✅ Database support for price field
- ✅ Model attribute casting
- ✅ API validation
- ✅ Mass assignment protection
- ✅ Soft deletes support maintained

## Technical Details

### API Endpoints:
All existing endpoints automatically support the price field:
- `POST /api/subjects` - Create subject with price
- `PUT /api/subjects/{id}` - Update subject price
- `GET /api/subjects` - Retrieve subjects with price
- `GET /api/subjects/{id}` - Get single subject with price
- `DELETE /api/subjects/{id}` - Delete subject

### Database Schema:
```sql
ALTER TABLE subjects ADD COLUMN price DECIMAL(10, 2) DEFAULT 0 NULLABLE AFTER units;
```

### Model Attributes:
The Subject model now properly casts the price as a decimal with 2 decimal places:
```php
'price' => 'decimal:2'
```

## Testing Checklist

- [ ] Migration runs without errors: `php artisan migrate --step`
- [ ] Can add a subject with price 5000
- [ ] Price appears in the subject table
- [ ] Can edit subject price through modal
- [ ] Price displays with peso symbol (₱)
- [ ] Price validation works (no negative numbers)
- [ ] Empty price allowed and displays as "N/A" or "₱0.00"
- [ ] Other subject operations (delete, view) work correctly
- [ ] No errors in browser console
- [ ] API returns correct price values

## Troubleshooting

### Migration Not Running:
```bash
# Check migration status
php artisan migrate:status

# If stuck, reset carefully (WARNING: deletes data)
php artisan migrate:reset

# Re-run all migrations
php artisan migrate
```

### Vendor Directory Issue:
If you get vendor/autoload.php not found:
```bash
rm -rf vendor composer.lock
composer install
```

### Database Connection Error:
Ensure `.env` file has correct database configuration:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

## Notes

- The price field is optional for backward compatibility
- Existing subjects without a price will display as "N/A" until updated
- Price values are stored as DECIMAL(10,2) for precise financial calculations
- The frontend automatically formats prices with peso symbol (₱) and commas
- No changes needed to other features - they automatically support the new field

## Files Modified

1. ✅ `database/migrations/2026_01_24_000001_add_price_to_subjects_table.php` - NEW
2. ✅ `app/Models/Subject.php` - UPDATED
3. ✅ `app/Http/Controllers/SubjectController.php` - UPDATED
4. ✅ `resources/services/AdminSubjectService.ts` - UPDATED
5. ✅ `resources/js/pages/Admin/Subjects.tsx` - NO CHANGES NEEDED (already supported)

## Support

For issues or questions:
1. Check the browser console for errors (F12)
2. Check Laravel logs: `storage/logs/laravel.log`
3. Verify database migration ran: `php artisan migrate:status`
4. Ensure all dependencies are installed: `composer install && npm install`

