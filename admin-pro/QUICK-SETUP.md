# ⚡ Quick Setup Guide - 5 Minutes

## 🎯 What to Copy from Supabase Dashboard

Go to: **Supabase Dashboard → Your Ezra Project → Settings → API**

Copy these two values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

## 📝 Step 1: Update config.js

Open `admin-pro/config.js` and replace:

```javascript
// Replace THESE lines:
SUPABASE_URL: 'https://your-project-ref.supabase.co',
SUPABASE_ANON_KEY: 'your-anon-key-here',

// With YOUR actual values:
SUPABASE_URL: 'https://your-actual-project.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
```

## 👤 Step 2: Create Admin User

In **Supabase SQL Editor**, run:

```sql
-- Option A: Update existing user to admin
UPDATE profiles 
SET role = 'admin', is_active = true 
WHERE email = 'your-email@gmail.com';

-- Option B: Or create new admin user
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
    gen_random_uuid(),
    'admin@ezraservice.com',
    'Ezra Administrator',
    'admin',
    true
);
```

## 🧪 Step 3: Test Everything

1. **Open**: https://armelcy.github.io/ezraservices-landing-page/admin-pro/test-connection.html
2. **Should see**: All ✅ green checkmarks
3. **If red ❌**: Check credentials in config.js

## 🔑 Step 4: Login to Dashboard

1. **Open**: https://armelcy.github.io/ezraservices-landing-page/admin-pro/
2. **Login with**: Your admin email and Supabase password
3. **Should see**: Real data from your Ezra marketplace!

## 🎉 Success Indicators

✅ **Real user counts** (not 12,847 mock data)  
✅ **Actual pending KYC** from your providers  
✅ **Live booking activity** from your marketplace  
✅ **Real revenue** calculations from your data  
✅ **Activity feed** with actual events  

---

**Ready? Let's configure it!** 🚀