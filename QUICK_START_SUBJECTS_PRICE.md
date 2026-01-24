# Quick Start: Subject Price Feature

## What Was Done

I've implemented support for adding prices to subjects in your Grading System. Here's everything that was set up:

### ✅ Completed Changes:

1. **Database Migration** - Added a `price` column to the subjects table
2. **Laravel Model** - Updated Subject model to handle price field
3. **Backend Validation** - Added price validation in SubjectController
4. **Frontend Types** - Updated TypeScript interfaces for price support
5. **User Interface** - Already supports price display and editing (no changes needed)

## Quick Setup (3 Steps)

### Step 1: Run the Migration
```bash
php artisan migrate --step
```

If that doesn't work due to vendor issues, you can manually run this SQL:
```sql
ALTER TABLE subjects ADD COLUMN price DECIMAL(10, 2) DEFAULT 0 NULL AFTER units;
```

### Step 2: Start the Servers

**Terminal 1 - Laravel Backend:**
```bash
php artisan serve --host=localhost --port=8000
```

**Terminal 2 - Frontend (Vite):**
```bash
npm run dev
```

### Step 3: Test in Browser
1. Go to Admin Panel → Subject Management
2. Click "+ Add Subject"
3. Fill form with:
   - Code: `TEST101`
   - Name: `Test Subject`
   - Units: `3`
   - **Price: `5000`** ← This is new!
4. Click "Add Subject"

You should see the subject in the table with price showing as **₱5,000.00**

## Testing the Feature

### ✅ Add Subject with Price
1. Admin Panel → Subject Management
2. Click "+ Add Subject"
3. Enter all fields including **Price: 5000**
4. Click "Add Subject"
5. **Result:** Subject appears in table with price

### ✅ Edit Subject Price
1. Find a subject in the table
2. Click the **edit icon** (pencil ✎)
3. Change the price field
4. Click "Update Subject"
5. **Result:** Price updates in the table

### ✅ View Subject Details
1. Find a subject in the table
2. Click the **eye icon** (👁️)
3. **Result:** Modal shows all details including price

### ✅ Delete Subject
- Works as before, unaffected by price feature

## What You Can Do Now

- ✅ Add new subjects with optional prices
- ✅ Edit subject prices anytime
- ✅ View prices in the subject list
- ✅ Price displays with peso symbol (₱) and proper formatting
- ✅ Price validation (no negative numbers allowed)
- ✅ Empty price allowed (displays as "N/A")

## File Changes

All changes are located in:
```
1. database/migrations/2026_01_24_000001_add_price_to_subjects_table.php (NEW)
2. app/Models/Subject.php (UPDATED)
3. app/Http/Controllers/SubjectController.php (UPDATED)
4. resources/services/AdminSubjectService.ts (UPDATED)
```

The frontend component (`resources/js/pages/Admin/Subjects.tsx`) already had full price support - no changes needed there!

## Troubleshooting

### ❌ "Migration not found" error
- Ensure you're in the project root directory
- Run: `php artisan migrate:status` to check status
- Check that the migration file exists: `database/migrations/2026_01_24_000001_add_price_to_subjects_table.php`

### ❌ "autoload.php not found" error
```bash
# Force vendor reinstall
rm -rf vendor composer.lock
composer install
php artisan migrate --step
```

### ❌ Price not showing in table
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Restart npm dev server
- Make sure migration ran: `php artisan migrate:status`

### ❌ Can't add price - validation error
- Make sure price is a number (e.g., 5000 or 5000.50)
- Don't use currency symbols or commas in input
- Price must be >= 0

## Technical Details

### Database Column:
```sql
price DECIMAL(10, 2) DEFAULT 0 NULL
```
- Supports prices up to 99,999,999.99
- 2 decimal places
- Can be null/empty
- Default value: 0

### API Support:
All API endpoints now support price:
```
POST /api/subjects              (create with price)
PUT  /api/subjects/:id           (update price)
GET  /api/subjects               (retrieve with price)
GET  /api/subjects/:id           (get single with price)
DELETE /api/subjects/:id         (delete - unchanged)
```

### Frontend Display:
- Input: Regular number field
- Table: "₱5,000.00" format
- Details: "₱5,000.00" format
- Empty: "N/A" or "₱0.00"

## Next Steps

1. ✅ Run migration
2. ✅ Start servers
3. ✅ Go to Subject Management
4. ✅ Add a subject with price 5000
5. ✅ Test editing the price
6. ✅ Verify it displays correctly in the table

That's it! The feature is ready to use.

## Support

If you encounter any issues:

1. **Check Laravel logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Check browser console:**
   Press F12 → Console tab for JavaScript errors

3. **Verify migration:**
   ```bash
   php artisan migrate:status
   ```

4. **Reset database (if needed - WARNING: deletes data):**
   ```bash
   php artisan migrate:reset
   php artisan migrate
   ```

---

**You're all set!** Start with Step 1 above and test the feature. Let me know if you hit any issues.

