# Setup (10 min)

## Supabase (projects, skills, certificates, links, contact messages, images, admin login)
1. supabase.com par naya project banao.
2. SQL Editor me `supabase/schema.sql` paste karke Run karo (isme admin email already set hai — apna email ho to badal lena).
3. Authentication > Users > "Add user": wahi email + strong password. Phir Authentication > Providers > Email me **sign-ups disable** kar do.
4. Settings > API se `URL` aur `anon key` copy karo.

## Firebase (5-star feedback)
1. console.firebase.google.com par project banao, Firestore Database create karo.
2. Firestore > Rules me `firestore.rules` paste karke Publish karo.
3. Project settings > Web app register karke config copy karo.

## Env
`.env.example` ko `.env.local` banao aur values bharo. Vercel me same variables Settings > Environment Variables me daalo.

## Use
`/admin` kholo, login karo, aur Projects / Skills / Certificates / Links add-edit karo. Contact messages bhi wahin dikhte hain.
Pehle koi data nahi hai to site `lib/data.ts` ke defaults dikhati hai.

## AI chat
Vercel > Settings > Environment Variables me `GEMINI_API_KEY` daalo (aistudio.google.com/apikey se free key), phir **Redeploy**.
(OpenRouter chahiye to `OPENROUTER_API_KEY` + `OPENROUTER_MODEL`.) Error aaye to chat bubble me asli reason dikhega.

## Purana data
`supabase/seed.sql` SQL Editor me Run karo — purane portfolio ke projects, skills, certificates import ho jaate hain.

## Frames
148 frames zip me nahi hain. Apne repo me `public/frames/ezgif-frame-001.jpg` … `148.jpg` pehle se rakhe hain, unhe mat chhedo.
