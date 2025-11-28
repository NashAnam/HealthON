# Admin Payment Debugging Checklist

## Step 1: Verify Payment Exists in Database
Run this in Supabase SQL Editor:
```sql
SELECT * FROM payments WHERE payment_status = 'pending_verification';
```

**Expected:** Should show 1 row with transaction_id = '1234567890'

## Step 2: Check Browser Console
1. Open https://careon-indol.vercel.app/admin
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for errors (red text)
5. Look for "Loaded payments:" log

**What to look for:**
- "Loaded payments: []" = Query worked but no data
- "Payments error:" = Query failed
- No logs = Page not loading

## Step 3: Check Network Tab
1. In DevTools, go to Network tab
2. Refresh the page
3. Look for requests to Supabase
4. Check if any failed (red)

## Step 4: Verify Deployment
1. Go to https://vercel.com
2. Check latest deployment status
3. Make sure it's from commit "db16c90"
4. Check build logs for errors

## Step 5: Test Locally
If production doesn't work, test locally:
```bash
npm run dev
```
Then go to http://localhost:3000/admin

## Quick Fix Options:

### Option A: Delete orphaned payment
```sql
DELETE FROM payments WHERE patient_id = 'a707f2e1-88a6-477d-9661-096467b86a34';
```
Then create a NEW payment through the app

### Option B: Check RLS Policies
```sql
-- Check if RLS is blocking admin access
SELECT * FROM payments WHERE payment_status = 'pending_verification';
```
If this works in SQL but not in app, RLS is the issue

## What to tell me:
1. ✅ or ❌ Payment exists in database?
2. ✅ or ❌ Console shows "Loaded payments"?
3. ✅ or ❌ Any errors in console?
4. ✅ or ❌ Vercel deployment successful?
5. URL you're using: ________________
