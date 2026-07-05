# Free Deploy Guide - Regal School System

## Architecture
```
Frontend (React) → Netlify.com (FREE)
Backend (Node.js) → Render.com (FREE)
Database (SQLite) → Render pe stored
```

---

## STEP 1: GitHub pe Upload Karo

### 1.1 GitHub Account banao
- https://github.com pe jao
- Free account banao

### 1.2 Repository banao
- Naya repo banao: `regal-school-system`
- Public rakho (free hai)

### 1.3 Code Upload karo
```bash
# Terminal kholo project folder mein
cd "C:\Users\hp\Desktop\school mangement system"

git init
git add .
git commit -m "Initial commit - Regal School System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/regal-school-system.git
git push -u origin main
```

---

## STEP 2: Backend Deploy karo (Render.com)

### 2.1 Render Account banao
- https://render.com pe jao
- GitHub se sign up karo (FREE)

### 2.2 Naya Web Service banao
1. **New** → **Web Service** click karo
2. GitHub repo select karo: `regal-school-system`
3. Settings:
   - **Name:** `regal-school-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

### 2.3 Environment Variables set karo
Render Dashboard → Environment tab mein ye daalo:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=regal_school_secret_2026_production_secure
```

### 2.4 Deploy
- **Save** karo
- Auto deploy hoga
- Kuch der baad URL milega: `https://regal-school-backend.onrender.com`

### 2.5 Test karo
- Browser mein jao: `https://regal-school-backend.onrender.com/api/health`
- Agar `{"status":"ok"}` aaye = Backend chal raha hai! ✅

---

## STEP 3: Frontend Deploy karo (Netlify)

### 3.1 Netlify Account banao
- https://netlify.com pe jao
- GitHub se sign up karo (FREE)

### 3.2 Naya Site banao
1. **Add new site** → **Import an existing project**
2. GitHub select karo: `regal-school-system`
3. Settings:
   - **Branch:** `main`
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

### 3.3 Environment Variables set karo
Site Settings → Environment Variables:

```
VITE_API_URL=https://regal-school-backend.onrender.com
```

### 3.4 Deploy
- **Deploy site** click karo
- Kuch der baad URL milega: `https://random-name.netlify.app`

### 3.5 Custom Domain (Optional)
- Site Settings → Domain Management
- `regal.school` ya `regal-school.netlify.app` add karo

---

## STEP 4: Frontend mein API URL Update karo

Deploy hone ke baad, frontend ko batana padega ke backend kahan hai.

### 4.1 API Configuration Update
Frontend `src/api.js` ya `src/App.jsx` mein:

```javascript
// Production ke liye
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function api() {
  const token = localStorage.getItem('token')
  return axios.create({
    baseURL: `${API_URL}/api`,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
}
```

---

## STEP 5: Database Backup (Important!)

SQLite file server pe hai. Agar Render restart ho to data loss ho sakta hai.

### Solution: PostgreSQL Use Karo (Free)
Render mein free PostgreSQL milta hai:
1. Render Dashboard → **New** → **PostgreSQL**
2. Free plan select karo
3. Database URL copy karo
4. Backend mein connection change karna padega

---

## Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Netlify (Frontend) | Free | $0 |
| Render (Backend) | Free | $0 |
| GitHub | Free | $0 |
| **Total** | | **$0** |

### Free Tier Limitations:
- **Render:** 15 min inactive ho to sleep hota hai (first request 30s lega)
- **Netlify:** 100GB bandwidth/month
- **Database:** 90 days free (Render PostgreSQL)

---

## Troubleshooting

### Backend Sleep ho raha hai?
- Free tier pe 15 min baad sleep hota hai
- First request slow aati hai (30-60 seconds)
- Solution: UptimeRobot se ping karo har 5 min

### Frontend API error dikha raha hai?
- Netlify mein VITE_API_URL check karo
- Backend URL sahi hai ya nahi verify karo

### CORS Error?
- Backend mein CORS config check karo
- Netlify domain allow karo

---

## Post-Deploy Checklist

- [ ] Backend health check works
- [ ] Login works on live URL
- [ ] Students add/edit works
- [ ] Attendance marking works
- [ ] Notifications show for Super Admin
- [ ] Mobile responsive check

---

**Deploy karne ke baad mujhe live URL do, main test karunga!** 🚀
