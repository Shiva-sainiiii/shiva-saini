# Setup

## Supabase (projects, skills, certificates, links, contact messages, images, admin login, chatbot settings)
1. supabase.com par naya project banao.
2. SQL Editor me `supabase/schema.sql` paste karke Run karo (isme admin email already set hai — apna email ho to badal lena).
   - **Agar purana schema.sql pehle hi run kar chuke ho**, to sirf `supabase/migration-002-admin.sql` run karo (projects me `category` tag + `settings` table add hota hai). Dobara chalane se koi nuksaan nahi.
3. Authentication > Users > "Add user": wahi email + strong password. Phir Authentication > Providers > Email me **sign-ups disable** kar do.
4. Settings > API se `URL` aur `anon key` copy karo.

## Firebase (5-star feedback)
1. console.firebase.google.com par project banao, Firestore Database create karo.
2. Firestore > Rules me `firestore.rules` paste karke Publish karo. **Rules ko loose mat karna** — feedback delete admin panel se server route ke through hota hai, rules me delete band hi rehna chahiye.
3. Project settings > Web app register karke config copy karo.
4. **Admin se feedback delete karne ke liye (server-only key):**
   Project settings (gear) > **Service accounts** > "Generate new private key" > JSON file download hogi.
   File kholo, **poora content** copy karo aur Vercel me env `FIREBASE_SERVICE_ACCOUNT` me paste karo.
   ⚠️ Ye file/key kabhi GitHub par commit mat karna, aur naam ke aage `NEXT_PUBLIC_` mat lagana.

## AI chatbot (Google AI Studio, free)
1. aistudio.google.com/apikey > "Create API key".
2. Vercel > Settings > Environment Variables > `GEMINI_API_KEY` = tumhari key.
3. (Optional) `GEMINI_MODEL` — free tier me sirf Flash / Flash-Lite models chalte hain. Default `gemini-3.1-flash-lite,gemini-2.5-flash-lite` hai (pehla fail ho to agla try hota hai). Google naam badal de to yahan naya naam daal do, code nahi badalna.
4. Free tier me Google visitors ki chats apne products improve karne ke liye use kar sakta hai, aur per-minute limit chhoti hoti hai (busy hone par site friendly message dikhati hai).

## Env
`.env.example` ko `.env.local` banao aur values bharo. Vercel me same variables Settings > Environment Variables me daalo.
**Env change karne ke baad Vercel me Redeploy zaroori hai** (nahi to purane build me naya env nahi dikhta).

## Use
- `https://tumhari-site/admin` kholo (footer me bhi chhota "Admin" link hai) aur login karo.
- Tabs: **Projects** (naam, short description, cover image, skills, tag: Web Game / AI / Website), **Skills**, **Certificates** (photo + naam), **Links**, **Feedback** (delete), **Messages** (contact form), **Chatbot** (on/off, naam, greeting, extra info, test message).
- Pehle koi data nahi hai to site `lib/data.ts` ke defaults dikhati hai.
- Chatbot section site pe tabhi dikhta hai jab `GEMINI_API_KEY` set ho aur Chatbot tab me "show" on ho.

## Local run
```
npm install
npm run dev
```
