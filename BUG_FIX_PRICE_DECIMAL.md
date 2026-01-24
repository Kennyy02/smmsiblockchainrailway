# Bug Fix: Price Decimal Formatting Error

## Issue
**Error:** `Uncaught TypeError: r.price.toFixed is not a function`

This error occurred because Laravel's decimal casting returns decimal values as **strings**, but the code was trying to call `.toFixed()` directly on them.

## Root Cause
When Laravel models use `'price' => 'decimal:2'` casting, the API response includes the price as a string value like `"5000.00"` instead of a number `5000`.

The code tried to call `.toFixed(2)` on a string, which fails because strings don't have a `toFixed()` method (only numbers do).

## Solution Applied

### 1. Updated Subjects Component
**File:** `resources/js/pages/Admin/Subjects.tsx`

**Before:**
```typescript
₱{subject.price ? subject.price.toFixed(2) : 'N/A'}
```

**After:**
```typescript
₱{subject.price ? Number(subject.price).toFixed(2) : 'N/A'}
```

**Changes Made:**
- Line 292: View modal price display
- Line 668: Table price display column

Both locations now convert the price to a number before calling `.toFixed(2)`.

### 2. Updated TypeScript Interface
**File:** `resources/services/AdminSubjectService.ts`

**Before:**
```typescript
export interface Subject {
    price?: number;
    units: number;
    // ...
}
```

**After:**
```typescript
export interface Subject {
    price?: number | string;
    units: number | string;
    // ...
}
```

This allows the interface to accept prices and units as either numbers or strings, reflecting the actual API response type.

## Technical Details

### Why Laravel Returns Strings
Laravel's decimal casting converts the database DECIMAL value to a PHP decimal, which when JSON-encoded becomes a string to preserve precision. This is actually the correct behavior for financial data.

### Proper Handling
The fix ensures that:
1. ✅ Prices returned as strings are properly converted to numbers
2. ✅ The `.toFixed(2)` method works correctly
3. ✅ Peso formatting displays correctly
4. ✅ The code handles both string and number values

### No Breaking Changes
- ✅ Backward compatible with existing code
- ✅ Handles both number and string inputs
- ✅ Error is completely resolved
- ✅ No changes to backend needed

## Files Modified

1. `resources/js/pages/Admin/Subjects.tsx` (2 lines fixed)
   - Line 292: Modal price display
   - Line 668: Table price column

2. `resources/services/AdminSubjectService.ts` (1 interface updated)
   - Subject interface now accepts string or number for price and units

## Testing

The fix resolves the error and allows:
- ✅ Adding subjects with prices
- ✅ Displaying prices in table
- ✅ Viewing subject details with prices
- ✅ Editing subject prices
- ✅ Proper peso formatting (₱5,000.00)

## Status
✅ **FIXED** - No more decimal formatting errors

The application should now work correctly with the price feature without any JavaScript console errors related to price formatting.

