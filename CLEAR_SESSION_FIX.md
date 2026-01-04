# How to Fix Login Redirect Issue

## The Problem
When you click "Login" or type `/login`, you're redirected back to the home page. This happens because Laravel's `guest` middleware sees a stale session cookie and thinks you're authenticated, so it redirects authenticated users away from the login page.

## Quick Fix (Clear Browser Data)

### Option 1: Clear Cookies (Recommended)
1. Open your browser's Developer Tools (Press F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, expand **Cookies**
4. Click on `smmsiblockchain.onrender.com`
5. Delete all cookies (or right-click → Clear)
6. Refresh the page (Ctrl+R or F5)
7. Try accessing `/login` again

### Option 2: Use Incognito/Private Window
1. Open a new Incognito/Private window (Ctrl+Shift+N in Chrome, Ctrl+Shift+P in Firefox)
2. Go to `smmsiblockchain.onrender.com/login`
3. This will have a fresh session with no cookies

### Option 3: Clear All Site Data
1. Click the lock icon or site info icon in the address bar
2. Click "Site settings" or "Permissions"
3. Click "Clear data" or "Reset permissions"
4. Refresh the page

## Why This Happens

Laravel's `guest` middleware works like this:
- If user is authenticated → redirect away from login page (to prevent authenticated users from seeing login)
- If user is NOT authenticated → allow access to login page

When you close the browser without logging out:
- Session expires on the server
- But the session cookie might still exist in your browser
- Laravel sees the cookie and tries to use it
- If the cookie is stale but not cleared, it can cause this redirect loop

## After Clearing Cookies

Once you clear the cookies:
1. You'll be properly logged out
2. The `guest` middleware will see you're not authenticated
3. You'll be able to access `/login` normally
4. You can log in again with your credentials

This is a one-time fix - once you clear the cookies, the login should work normally.

