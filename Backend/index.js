const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ api: 'CineSphere', status: 'running' }));

async function runQuery(res, sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

app.get('/api/analytics/kpis', async (req, res) => {
  try {
    const q = `
      SELECT
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='Completed') AS total_revenue,
        (SELECT COUNT(*) FROM bookings WHERE status='Confirmed')                 AS total_bookings,
        (SELECT COUNT(*) FROM customers)                                         AS total_customers,
        (SELECT COUNT(*) FROM movies)                                            AS total_movies,
        (SELECT ROUND(AVG(rating),2) FROM reviews)                               AS avg_rating,
        (SELECT COUNT(*) FROM booking_seats)                                     AS seats_sold,
        (SELECT COUNT(*) FROM seats)                                             AS total_seats`;
    const result = await pool.query(q);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/revenue-by-cinema', (req, res) => runQuery(res, `
  SELECT c.name AS label, COALESCE(SUM(p.amount),0) AS value
  FROM cinemas c
  LEFT JOIN screens sc  ON sc.cinema_id = c.cinema_id
  LEFT JOIN showtimes st ON st.screen_id = sc.screen_id
  LEFT JOIN bookings b   ON b.showtime_id = st.showtime_id AND b.status='Confirmed'
  LEFT JOIN payments p   ON p.booking_id = b.booking_id   AND p.status='Completed'
  GROUP BY c.name ORDER BY value DESC`));

app.get('/api/analytics/top-movies', (req, res) => runQuery(res, `
  SELECT m.title AS label, COUNT(bs.booking_seat_id) AS value
  FROM movies m
  JOIN showtimes st     ON st.movie_id = m.movie_id
  JOIN bookings b       ON b.showtime_id = st.showtime_id AND b.status='Confirmed'
  JOIN booking_seats bs ON bs.booking_id = b.booking_id
  GROUP BY m.title ORDER BY value DESC LIMIT 6`));

app.get('/api/analytics/genre-distribution', (req, res) => runQuery(res, `
  SELECT g.name AS label, COUNT(bs.booking_seat_id) AS value
  FROM genres g
  JOIN movies m         ON m.genre_id = g.genre_id
  JOIN showtimes st     ON st.movie_id = m.movie_id
  JOIN bookings b       ON b.showtime_id = st.showtime_id AND b.status='Confirmed'
  JOIN booking_seats bs ON bs.booking_id = b.booking_id
  GROUP BY g.name ORDER BY value DESC`));

app.get('/api/analytics/bookings-trend', (req, res) => runQuery(res, `
  SELECT st.show_date::text AS label, COUNT(b.booking_id) AS value
  FROM showtimes st
  JOIN bookings b ON b.showtime_id = st.showtime_id AND b.status='Confirmed'
  GROUP BY st.show_date ORDER BY st.show_date`));

app.get('/api/analytics/revenue-by-seat-class', (req, res) => runQuery(res, `
  SELECT s.seat_class AS label, COALESCE(SUM(st.base_price),0) AS value
  FROM booking_seats bs
  JOIN seats s      ON s.seat_id = bs.seat_id
  JOIN bookings b   ON b.booking_id = bs.booking_id AND b.status='Confirmed'
  JOIN showtimes st ON st.showtime_id = b.showtime_id
  GROUP BY s.seat_class ORDER BY value DESC`));

app.get('/api/analytics/payment-methods', (req, res) => runQuery(res, `
  SELECT method AS label, COUNT(*) AS value
  FROM payments WHERE status='Completed'
  GROUP BY method ORDER BY value DESC`));

app.get('/api/analytics/membership-distribution', (req, res) => runQuery(res, `
  SELECT tier AS label, COUNT(*) AS value
  FROM memberships GROUP BY tier ORDER BY value DESC`));

app.get('/api/analytics/peak-hours', (req, res) => runQuery(res, `
  SELECT TO_CHAR(st.start_time,'HH24:00') AS label, COUNT(bs.booking_seat_id) AS value
  FROM showtimes st
  JOIN bookings b       ON b.showtime_id = st.showtime_id AND b.status='Confirmed'
  JOIN booking_seats bs ON bs.booking_id = b.booking_id
  GROUP BY 1 ORDER BY 1`));

app.get('/api/analytics/top-concessions', (req, res) => runQuery(res, `
  SELECT ci.name AS label, SUM(coi.quantity) AS value
  FROM concession_order_items coi
  JOIN concession_items ci ON ci.item_id = coi.item_id
  GROUP BY ci.name ORDER BY value DESC LIMIT 6`));

app.get('/api/analytics/screen-occupancy', (req, res) => runQuery(res, `
  SELECT (c.city || ' - ' || sc.screen_name) AS label,
         ROUND(100.0 * COUNT(bs.booking_seat_id) / NULLIF(sc.capacity,0), 1) AS value
  FROM screens sc
  JOIN cinemas c          ON c.cinema_id = sc.cinema_id
  LEFT JOIN showtimes st  ON st.screen_id = sc.screen_id
  LEFT JOIN bookings b    ON b.showtime_id = st.showtime_id AND b.status='Confirmed'
  LEFT JOIN booking_seats bs ON bs.booking_id = b.booking_id
  GROUP BY c.city, sc.screen_name, sc.capacity ORDER BY value DESC`));

const RESOURCES = {
  genres:                 { table: 'genres',                 pk: 'genre_id',      cols: ['name','description'] },
  cinemas:                { table: 'cinemas',                pk: 'cinema_id',     cols: ['name','city','address','opening_date'] },
  customers:              { table: 'customers',              pk: 'customer_id',   cols: ['full_name','email','phone','gender','city','join_date'] },
  movies:                 { table: 'movies',                 pk: 'movie_id',      cols: ['title','genre_id','duration_min','certificate','language','release_date','director','synopsis'] },
  actors:                 { table: 'actors',                 pk: 'actor_id',      cols: ['full_name','nationality','birth_year'] },
  movie_cast:             { table: 'movie_cast',             pk: 'movie_id',      cols: ['movie_id','actor_id','role_name'] },
  screens:                { table: 'screens',                pk: 'screen_id',     cols: ['cinema_id','screen_name','screen_type','capacity'] },
  seats:                  { table: 'seats',                  pk: 'seat_id',       cols: ['screen_id','row_label','seat_number','seat_class'] },
  showtimes:              { table: 'showtimes',              pk: 'showtime_id',   cols: ['movie_id','screen_id','show_date','start_time','base_price'] },
  memberships:            { table: 'memberships',            pk: 'membership_id', cols: ['customer_id','tier','points','start_date'] },
  bookings:               { table: 'bookings',               pk: 'booking_id',    cols: ['customer_id','showtime_id','booking_time','status','total_amount'] },
  booking_seats:          { table: 'booking_seats',          pk: 'booking_seat_id', cols: ['booking_id','seat_id'] },
  payments:               { table: 'payments',               pk: 'payment_id',    cols: ['booking_id','amount','method','status','paid_at'] },
  staff_roles:            { table: 'staff_roles',            pk: 'role_id',       cols: ['role_name','base_salary'] },
  staff:                  { table: 'staff',                  pk: 'staff_id',      cols: ['cinema_id','role_id','full_name','phone','hire_date'] },
  concession_items:       { table: 'concession_items',       pk: 'item_id',       cols: ['name','category','price'] },
  concession_orders:      { table: 'concession_orders',      pk: 'corder_id',     cols: ['customer_id','cinema_id','order_time','total_amount'] },
  concession_order_items: { table: 'concession_order_items', pk: 'coi_id',        cols: ['corder_id','item_id','quantity','unit_price'] },
  reviews:                { table: 'reviews',                pk: 'review_id',     cols: ['customer_id','movie_id','rating','comment','review_date'] },
  promotions:             { table: 'promotions',             pk: 'promo_id',      cols: ['code','description','discount_percent','valid_from','valid_to'] }
};

app.get('/api/resources', (req, res) => res.json(Object.keys(RESOURCES)));

app.get('/api/schema', (req, res) => {
  const schema = {};
  for (const [name, cfg] of Object.entries(RESOURCES)) {
    schema[name] = { pk: cfg.pk, cols: cfg.cols };
  }
  res.json(schema);
});

app.get('/api/:resource/count', async (req, res) => {
  const cfg = RESOURCES[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  try {
    const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${cfg.table}`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/:resource', async (req, res) => {
  const cfg = RESOURCES[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  try {
    const result = await pool.query(`SELECT * FROM ${cfg.table} ORDER BY ${cfg.pk} LIMIT 500`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/:resource', async (req, res) => {
  const cfg = RESOURCES[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });

  const cols = cfg.cols.filter(c => req.body[c] !== undefined && req.body[c] !== '');
  if (cols.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

  const values = cols.map(c => req.body[c]);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`;

  try {
    const result = await pool.query(sql, values);
    res.status(201).json({ message: 'Created', row: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/:resource/:id', async (req, res) => {
  const cfg = RESOURCES[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });

  const cols = cfg.cols.filter(c => req.body[c] !== undefined && req.body[c] !== '');
  if (cols.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

  const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const values = cols.map(c => req.body[c]);
  values.push(req.params.id);
  const sql = `UPDATE ${cfg.table} SET ${setClause} WHERE ${cfg.pk} = $${values.length} RETURNING *`;

  try {
    const result = await pool.query(sql, values);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Updated', row: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/:resource/:id', async (req, res) => {
  const cfg = RESOURCES[req.params.resource];
  if (!cfg) return res.status(404).json({ error: 'Unknown resource' });
  try {
    const result = await pool.query(
      `DELETE FROM ${cfg.table} WHERE ${cfg.pk} = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Deleted', row: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 6006;
app.listen(PORT, () => console.log(`🎬 CineSphere API running on http://localhost:${PORT}`));
