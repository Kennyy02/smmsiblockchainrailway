# Quick Fix: Render PHP Runtime Issue

## The Problem
Your service is configured as "Node" instead of "PHP", so Composer isn't available.

## The Solution (5 Minutes)

### 1. Delete Current Service
- Render Dashboard → Blockchain-Grading-System service
- Settings (left sidebar)
- Scroll down → Click "Delete Service"
- Confirm deletion

### 2. Create New Service
- Click "New +" → "Web Service"
- Connect GitHub repo: `Kennyy02/Blockchain-Grading-System`
- **CRITICAL:** When you see runtime/environment options, select **"PHP"** (NOT Node.js!)

### 3. Verify
After creation, you should see:
- Tags: "PHP" and "Free" (NOT "Node")
- Build logs show "Using PHP version..." (NOT "Using Node.js version...")

### 4. Add Environment Variables
Before deploying, add in Settings → Environment:
- Database credentials from Railway
- APP_KEY
- APP_URL
- etc.

### 5. Deploy
Click "Manual Deploy" → "Deploy latest commit"

## Why This Happens
- Render detects runtime when service is first created
- If `package.json` exists, it defaults to Node.js
- `render.yaml` only applies to NEW services
- Can't change runtime on existing services

## Expected Result
✅ Build logs show PHP version
✅ Composer installs packages successfully  
✅ npm installs packages successfully
✅ Build completes successfully
✅ Service runs on PHP

