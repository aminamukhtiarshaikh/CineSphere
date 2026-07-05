# 🎬 CineSphere — Cinema Multiplex Network Management & Analytics

DBMS Final Semester Project
**Stack:** PostgreSQL (Neon) · Node.js + Express · HTML/CSS/Bootstrap/JavaScript + Chart.js

---

## 📁 Folder structure

```
CineSphere/
├── Database/
│   └── cinesphere_database.sql     ← Neon pe chalane wali SQL (20 tables + sample data)
├── Backend/
│   ├── index.js                    ← Express API (CRUD + analytics endpoints)
│   ├── db.js                       ← PostgreSQL connection (Neon)
│   ├── package.json
│   └── .env.example                ← isko ".env" banakar apna Neon URL daalo
└── Frontend/
    ├── index.html                  ← single-page dashboard
    ├── style.css                   ← theatre theme
    └── script.js                   ← fetch + charts + CRUD (API yahan set hai)
```

---

## ✅ STEP-BY-STEP (shuru se aakhir tak)

### STEP 1 — Neon database banao
1. https://neon.tech pe sign in karo → **New Project** banao.
2. Project ke andar **SQL Editor** kholo.
3. `Database/cinesphere_database.sql` file kholo, **poora content copy** karke SQL Editor mein paste karo.
4. **Run** dabao. Saari 20 tables + sample data ek dafa mein ban jayengi.
   - Ye script dobara bhi chal sakti hai (upar `DROP IF EXISTS` hai) — data reset ho jata hai.
5. Neon dashboard → **Connection Details** → connection string copy kar lo (iski zaroorat agle step mein hai).
   Wo aise dikhega: `postgresql://user:pass@ep-xxxx.neon.tech/dbname?sslmode=require`

### STEP 2 — Backend setup
1. Terminal kholo aur **Backend** folder mein jao:
   ```
   cd Backend
   ```
2. `.env.example` ko copy karke uska naam **`.env`** rakho (dot ke saath), phir andar apna Neon URL daalo:
   ```
   DATABASE_URL='yahan apna Neon connection string paste karo'
   PORT=6006
   ```
3. Dependencies install karo (ye express, pg, cors, dotenv download karega):
   ```
   npm install
   ```
4. Server chalao:
   ```
   node index.js
   ```
   Screen pe ye aana chahiye:
   ```
   🎬 CineSphere API running on http://localhost:6006
   ✅ Neon PostgreSQL se connection ban gaya.
   ```
   👉 **Ye terminal khula chhor do** (server chalta rehna chahiye).

### STEP 3 — Frontend chalao
- Backend wale terminal ko band kiye baghair, **Frontend/index.html** browser mein kholo.
  - Sab se asaan: VS Code mein **Live Server** extension se `index.html` "Open with Live Server".
  - Ya seedha file double-click bhi chal jayega (CORS already enabled hai).
- Dashboard khulte hi: upar status **"API connected"** (green), KPI cards bharte hain, 10 charts aate hain, aur neeche Data Explorer table + CRUD form chalta hai.

---

## 🔌 API ENDPOINTS (test karne ke liye)

Backend chal raha ho to browser ya Postman mein try karo:

**CRUD (har table pe chalti hai — 20 resources):**
| Method | URL | Kaam |
|--------|-----|------|
| GET    | `/api/movies`            | saari rows |
| GET    | `/api/movies/count`      | total count |
| POST   | `/api/movies`            | nayi row (JSON body) |
| PUT    | `/api/movies/:id`        | row update |
| DELETE | `/api/movies/:id`        | row delete |
| GET    | `/api/resources`         | sab table names |
| GET    | `/api/schema`            | har table ke columns (forms ke liye) |

`:resource` ki jagah koi bhi table aa sakti hai: genres, cinemas, customers, movies, actors,
movie_cast, screens, seats, showtimes, memberships, bookings, booking_seats, payments,
staff_roles, staff, concession_items, concession_orders, concession_order_items, reviews, promotions.

**Analytics (charts ke liye):**
```
/api/analytics/kpis
/api/analytics/revenue-by-cinema
/api/analytics/top-movies
/api/analytics/genre-distribution
/api/analytics/bookings-trend
/api/analytics/revenue-by-seat-class
/api/analytics/payment-methods
/api/analytics/membership-distribution
/api/analytics/peak-hours
/api/analytics/top-concessions
/api/analytics/screen-occupancy
```

---

## 🗄️ DATABASE — 20 tables (16 ki requirement se zyada)

genres, cinemas, customers, movies, actors, **movie_cast** (junction), screens, seats,
showtimes, memberships, bookings, **booking_seats** (junction), payments, staff_roles, staff,
concession_items, concession_orders, **concession_order_items** (junction), reviews, promotions.

Har table mein Primary Key, zaroori Foreign Keys, aur CHECK/UNIQUE/NOT NULL constraints lage hue hain.

---

## 📌 Report / Submission ke liye baqi cheezein
Guidelines ke mutabiq ye abhi banani hain (code ready hai):
- ERD diagram, Class diagram
- Project Report (PDF)
- API testing screenshots + dashboard screenshots
- Presentation

> Agle step mein in mein se ERD/Class diagram aur report ka draft banane mein madad le sakte ho.

---

## 🛠️ Agar masla aaye
- **`Cannot find module 'express'`** → Backend folder mein `npm install` chalao.
- **`Database connection FAIL`** → `.env` ka `DATABASE_URL` Neon se dobara copy karo (Neon free DB kuch din baad "suspend" ho jata hai, dobara open karne se resume ho jata hai).
- **Dashboard pe "API offline"** → backend terminal chal raha hai? port 6006 sahi hai? (agar port badla to `Frontend/script.js` ki pehli line `const API` bhi update karo.)
