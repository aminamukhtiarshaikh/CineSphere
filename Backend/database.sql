DROP TABLE IF EXISTS concession_order_items CASCADE;
DROP TABLE IF EXISTS concession_orders      CASCADE;
DROP TABLE IF EXISTS concession_items       CASCADE;
DROP TABLE IF EXISTS reviews                CASCADE;
DROP TABLE IF EXISTS payments               CASCADE;
DROP TABLE IF EXISTS booking_seats          CASCADE;
DROP TABLE IF EXISTS bookings               CASCADE;
DROP TABLE IF EXISTS showtimes              CASCADE;
DROP TABLE IF EXISTS seats                  CASCADE;
DROP TABLE IF EXISTS screens                CASCADE;
DROP TABLE IF EXISTS staff                  CASCADE;
DROP TABLE IF EXISTS staff_roles            CASCADE;
DROP TABLE IF EXISTS memberships            CASCADE;
DROP TABLE IF EXISTS promotions             CASCADE;
DROP TABLE IF EXISTS movie_cast             CASCADE;
DROP TABLE IF EXISTS actors                 CASCADE;
DROP TABLE IF EXISTS movies                 CASCADE;
DROP TABLE IF EXISTS genres                 CASCADE;
DROP TABLE IF EXISTS customers              CASCADE;
DROP TABLE IF EXISTS cinemas                CASCADE;

CREATE TABLE genres (
    genre_id     SERIAL PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,
    description  TEXT
);

CREATE TABLE cinemas (
    cinema_id    SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    city         VARCHAR(60)  NOT NULL,
    address      TEXT,
    opening_date DATE
);

CREATE TABLE customers (
    customer_id  SERIAL PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(120) UNIQUE NOT NULL,
    phone        VARCHAR(20),
    gender       VARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
    city         VARCHAR(60),
    join_date    DATE DEFAULT CURRENT_DATE
);

CREATE TABLE movies (
    movie_id     SERIAL PRIMARY KEY,
    title        VARCHAR(150) NOT NULL,
    genre_id     INT REFERENCES genres(genre_id) ON DELETE SET NULL,
    duration_min INT CHECK (duration_min > 0),
    certificate  VARCHAR(5) CHECK (certificate IN ('U','PG','15','18')),
    language     VARCHAR(40),
    release_date DATE,
    director     VARCHAR(100),
    synopsis     TEXT
);

CREATE TABLE actors (
    actor_id     SERIAL PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    nationality  VARCHAR(50),
    birth_year   INT
);

CREATE TABLE movie_cast (
    movie_id     INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    actor_id     INT REFERENCES actors(actor_id) ON DELETE CASCADE,
    role_name    VARCHAR(80),
    PRIMARY KEY (movie_id, actor_id)
);

CREATE TABLE screens (
    screen_id    SERIAL PRIMARY KEY,
    cinema_id    INT NOT NULL REFERENCES cinemas(cinema_id) ON DELETE CASCADE,
    screen_name  VARCHAR(40) NOT NULL,
    screen_type  VARCHAR(10) CHECK (screen_type IN ('2D','3D','IMAX','4DX')),
    capacity     INT CHECK (capacity > 0)
);

CREATE TABLE seats (
    seat_id      SERIAL PRIMARY KEY,
    screen_id    INT NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE,
    row_label    VARCHAR(2)  NOT NULL,
    seat_number  INT NOT NULL,
    seat_class   VARCHAR(15) CHECK (seat_class IN ('Standard','Premium','Recliner')),
    UNIQUE (screen_id, row_label, seat_number)
);

CREATE TABLE showtimes (
    showtime_id  SERIAL PRIMARY KEY,
    movie_id     INT NOT NULL REFERENCES movies(movie_id)  ON DELETE CASCADE,
    screen_id    INT NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE,
    show_date    DATE NOT NULL,
    start_time   TIME NOT NULL,
    base_price   NUMERIC(8,2) NOT NULL CHECK (base_price >= 0)
);

CREATE TABLE memberships (
    membership_id SERIAL PRIMARY KEY,
    customer_id   INT UNIQUE NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    tier          VARCHAR(10) CHECK (tier IN ('Silver','Gold','Platinum')),
    points        INT DEFAULT 0,
    start_date    DATE DEFAULT CURRENT_DATE
);

CREATE TABLE bookings (
    booking_id   SERIAL PRIMARY KEY,
    customer_id  INT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    showtime_id  INT NOT NULL REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    booking_time TIMESTAMP DEFAULT NOW(),
    status       VARCHAR(12) CHECK (status IN ('Confirmed','Cancelled','Pending')),
    total_amount NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE booking_seats (
    booking_seat_id SERIAL PRIMARY KEY,
    booking_id      INT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    seat_id         INT NOT NULL REFERENCES seats(seat_id) ON DELETE CASCADE,

      UNIQUE (booking_id, seat_id)
);

CREATE TABLE payments (
    payment_id   SERIAL PRIMARY KEY,
    booking_id   INT UNIQUE NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    amount       NUMERIC(10,2) NOT NULL,
    method       VARCHAR(10) CHECK (method IN ('Card','Cash','Wallet','Online')),
    status       VARCHAR(12) CHECK (status IN ('Completed','Refunded','Failed')),
    paid_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE staff_roles (
    role_id      SERIAL PRIMARY KEY,
    role_name    VARCHAR(50) NOT NULL UNIQUE,
    base_salary  NUMERIC(10,2)
);

CREATE TABLE staff (
    staff_id     SERIAL PRIMARY KEY,
    cinema_id    INT REFERENCES cinemas(cinema_id) ON DELETE SET NULL,
    role_id      INT REFERENCES staff_roles(role_id) ON DELETE SET NULL,
    full_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20),
    hire_date    DATE
);

CREATE TABLE concession_items (
    item_id      SERIAL PRIMARY KEY,
    name         VARCHAR(80) NOT NULL,
    category     VARCHAR(10) CHECK (category IN ('Snack','Drink','Combo')),
    price        NUMERIC(8,2) NOT NULL
);

CREATE TABLE concession_orders (
    corder_id    SERIAL PRIMARY KEY,
    customer_id  INT REFERENCES customers(customer_id) ON DELETE SET NULL,
    cinema_id    INT REFERENCES cinemas(cinema_id) ON DELETE SET NULL,
    order_time   TIMESTAMP DEFAULT NOW(),
    total_amount NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE concession_order_items (
    coi_id       SERIAL PRIMARY KEY,
    corder_id    INT NOT NULL REFERENCES concession_orders(corder_id) ON DELETE CASCADE,
    item_id      INT NOT NULL REFERENCES concession_items(item_id) ON DELETE CASCADE,
    quantity     INT CHECK (quantity > 0),
    unit_price   NUMERIC(8,2),

      UNIQUE (corder_id, item_id)
);

CREATE TABLE reviews (
    review_id    SERIAL PRIMARY KEY,
    customer_id  INT REFERENCES customers(customer_id) ON DELETE CASCADE,
    movie_id     INT REFERENCES movies(movie_id) ON DELETE CASCADE,
    rating       INT CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    review_date  DATE DEFAULT CURRENT_DATE,

      UNIQUE (customer_id, movie_id)
);

CREATE TABLE promotions (
    promo_id         SERIAL PRIMARY KEY,
    code             VARCHAR(20) NOT NULL UNIQUE,
    description      TEXT,
    discount_percent INT CHECK (discount_percent BETWEEN 0 AND 100),
    valid_from       DATE,
    valid_to         DATE
);

INSERT INTO genres (name, description) VALUES
('Action','High-energy stunts and chases'),
('Drama','Character-driven emotional stories'),
('Comedy','Light-hearted and funny'),
('Sci-Fi','Futuristic and speculative'),
('Horror','Suspense and scares'),
('Animation','Animated features'),
('Thriller','Tense edge-of-seat plots'),
('Romance','Love-centred stories');

INSERT INTO cinemas (name, city, address, opening_date) VALUES
('CineSphere Clifton','Karachi','Block 4, Clifton, Karachi','2019-03-15'),
('CineSphere Dolmen','Karachi','Dolmen Mall, Tariq Road, Karachi','2020-07-01'),
('CineSphere Gulberg','Lahore','MM Alam Road, Gulberg, Lahore','2021-01-20'),
('CineSphere Centaurus','Islamabad','Centaurus Mall, F-8, Islamabad','2022-09-10');

INSERT INTO customers (full_name, email, phone, gender, city, join_date) VALUES
('Ali Raza','ali.raza@example.com','03001234567','Male','Karachi','2023-01-10'),
('Sara Khan','sara.khan@example.com','03012345678','Female','Karachi','2023-02-14'),
('Bilal Ahmed','bilal.ahmed@example.com','03023456789','Male','Lahore','2023-03-05'),
('Hina Tariq','hina.tariq@example.com','03034567890','Female','Islamabad','2023-04-22'),
('Usman Sheikh','usman.sheikh@example.com','03045678901','Male','Karachi','2023-05-30'),
('Mariam Yousuf','mariam.y@example.com','03056789012','Female','Lahore','2023-06-18'),
('Faizan Malik','faizan.malik@example.com','03067890123','Male','Islamabad','2023-07-09'),
('Ayesha Noor','ayesha.noor@example.com','03078901234','Female','Karachi','2023-08-25'),
('Hamza Iqbal','hamza.iqbal@example.com','03089012345','Male','Lahore','2023-09-12'),
('Zainab Ali','zainab.ali@example.com','03090123456','Female','Karachi','2023-10-01'),
('Owais Farooq','owais.f@example.com','03101234567','Male','Islamabad','2023-11-15'),
('Nida Aslam','nida.aslam@example.com','03112345678','Female','Karachi','2024-01-08');

INSERT INTO movies (title, genre_id, duration_min, certificate, language, release_date, director, synopsis) VALUES
('Midnight Horizon',1,142,'15','English','2024-05-10','R. Mansoor','A pilot races against time to land a hijacked flight.'),
('Echoes of Lahore',2,128,'PG','Urdu','2024-04-02','S. Bhatti','Three generations reunite in an old Lahore haveli.'),
('Laugh Out Loud',3,105,'U','Urdu','2024-06-21','K. Jamil','A struggling comedian gets one last big break.'),
('Neon Protocol',4,150,'15','English','2024-03-18','A. Cheema','A hacker uncovers a city-wide AI conspiracy.'),
('The Whispering House',5,118,'18','English','2024-02-09','D. Saeed','A family moves into a house that remembers everything.'),
('Pixel Pals',6,96,'U','English','2024-07-04','M. Khan','Toys come alive to save their playground.'),
('The Last Witness',7,134,'15','English','2024-05-25','F. Raza','A detective protects the only witness to a crime.'),
('Monsoon Hearts',8,122,'PG','Urdu','2024-06-14','N. Qureshi','Two strangers fall in love during a Karachi monsoon.'),
('Steel Dawn',1,138,'15','English','2024-01-30','R. Mansoor','A retired soldier returns for one final mission.'),
('Glass Mirage',7,127,'15','English','2024-04-19','A. Cheema','Nothing is what it seems in a desert heist.'),
('Tiny Titans',6,101,'U','English','2024-08-02','M. Khan','Miniature heroes guard a giant city.'),
('Silent Verdict',2,131,'PG','Urdu','2024-03-08','S. Bhatti','A lawyer fights a case that could end her career.');

INSERT INTO actors (full_name, nationality, birth_year) VALUES
('Imran Vance','Pakistani',1985),
('Lia Karim','Pakistani',1990),
('David Cole','British',1982),
('Sana Mir','Pakistani',1993),
('Omar Daud','Pakistani',1988),
('Elena Rossi','Italian',1991),
('Bilal Shah','Pakistani',1979),
('Mona Sethi','Pakistani',1995),
('Jack Reed','American',1986),
('Hira Baig','Pakistani',1992),
('Tariq Niazi','Pakistani',1975),
('Nora Hayes','Canadian',1994);

INSERT INTO movie_cast (movie_id, actor_id, role_name) VALUES
(1,1,'Captain Adnan'),(1,2,'Co-pilot Mehak'),
(2,7,'Dada Jan'),(2,4,'Zoya'),
(3,5,'Saleem'),(3,8,'Rida'),
(4,3,'Cipher'),(4,10,'Maya'),
(5,6,'Clara'),(5,9,'Mark'),
(6,12,'Voice of Bolt'),(6,11,'Voice of Gizmo'),
(7,1,'Det. Saad'),(7,8,'Wajeeha'),
(8,5,'Hassan'),(8,2,'Noor'),
(9,7,'Major Asad'),(9,3,'Colonel Hart'),
(10,9,'Vince'),(10,6,'Selina'),
(11,11,'Captain Tiny'),(11,12,'Pixel'),
(12,4,'Adv. Sana'),(12,10,'Judge Karim');

INSERT INTO screens (cinema_id, screen_name, screen_type, capacity) VALUES
(1,'Screen 1','IMAX',50),(1,'Screen 2','3D',50),
(2,'Screen 1','2D',50),(2,'Screen 2','4DX',50),
(3,'Screen 1','3D',50),(3,'Screen 2','2D',50),
(4,'Screen 1','IMAX',50),(4,'Screen 2','3D',50);

INSERT INTO seats (screen_id, row_label, seat_number, seat_class)
SELECT s.screen_id,
       chr(64 + r)               AS row_label,
       n                         AS seat_number,
       CASE WHEN r = 1 THEN 'Recliner'
            WHEN r <= 3 THEN 'Premium'
            ELSE 'Standard' END  AS seat_class
FROM screens s
CROSS JOIN generate_series(1,5)  AS r
CROSS JOIN generate_series(1,10) AS n;

INSERT INTO showtimes (movie_id, screen_id, show_date, start_time, base_price) VALUES
(1,1,'2024-09-01','13:00',1200),(2,2,'2024-09-01','16:30',900),
(3,3,'2024-09-01','19:00',800),(4,4,'2024-09-02','14:00',1500),
(5,5,'2024-09-02','21:00',1000),(6,6,'2024-09-02','11:00',700),
(7,7,'2024-09-03','18:00',1200),(8,8,'2024-09-03','20:30',950),
(9,1,'2024-09-04','15:00',1200),(10,2,'2024-09-04','17:30',900),
(11,3,'2024-09-05','12:00',700),(12,4,'2024-09-05','19:30',1500),
(1,5,'2024-09-06','22:00',1100),(4,7,'2024-09-06','16:00',1500),
(7,8,'2024-09-07','13:30',1000),(2,6,'2024-09-07','18:30',850),
(9,1,'2024-09-08','20:00',1200),(5,2,'2024-09-08','21:30',1000),
(3,3,'2024-09-09','14:30',800),(8,4,'2024-09-09','19:00',950);

INSERT INTO memberships (customer_id, tier, points, start_date) VALUES
(1,'Gold',1250,'2023-01-15'),(2,'Platinum',3400,'2023-02-20'),
(3,'Silver',420,'2023-03-10'),(5,'Gold',980,'2023-06-01'),
(6,'Silver',300,'2023-06-25'),(8,'Platinum',2900,'2023-09-01'),
(10,'Gold',1500,'2023-10-05'),(11,'Silver',180,'2023-11-20');

INSERT INTO bookings (customer_id, showtime_id, booking_time, status, total_amount) VALUES
(1,1,'2024-09-01 12:10','Confirmed',2400),
(2,1,'2024-09-01 12:25','Confirmed',1200),
(3,2,'2024-09-01 15:40','Confirmed',1800),
(4,3,'2024-09-01 18:15','Confirmed',800),
(5,4,'2024-09-02 13:05','Confirmed',3000),
(6,5,'2024-09-02 20:10','Confirmed',2000),
(7,6,'2024-09-02 10:20','Cancelled',700),
(8,7,'2024-09-03 17:05','Confirmed',2400),
(9,8,'2024-09-03 19:45','Confirmed',1900),
(10,9,'2024-09-04 14:10','Confirmed',1200),
(11,10,'2024-09-04 16:50','Confirmed',2700),
(12,11,'2024-09-05 11:15','Confirmed',1400),
(1,12,'2024-09-05 18:40','Confirmed',3000),
(2,13,'2024-09-06 21:10','Confirmed',2200),
(3,14,'2024-09-06 15:20','Pending',1500),
(5,15,'2024-09-07 12:40','Confirmed',2000),
(6,16,'2024-09-07 17:55','Confirmed',1700),
(8,17,'2024-09-08 19:10','Confirmed',2400),
(9,18,'2024-09-08 20:50','Confirmed',2000),
(10,19,'2024-09-09 13:50','Confirmed',1600),
(11,20,'2024-09-09 18:20','Confirmed',1900),
(4,1,'2024-09-01 12:30','Confirmed',1200),
(7,9,'2024-09-04 14:25','Confirmed',2400),
(12,5,'2024-09-02 20:30','Confirmed',1000);

INSERT INTO booking_seats (booking_id, seat_id)
SELECT b.booking_id, sub.seat_id
FROM bookings b
JOIN showtimes st ON b.showtime_id = st.showtime_id
JOIN LATERAL (
    SELECT seat_id
    FROM seats
    WHERE screen_id = st.screen_id
    ORDER BY ((seat_id * 17 + b.booking_id * 31) % 50), seat_id
    LIMIT (1 + (b.booking_id % 3))
) sub ON TRUE
WHERE b.status = 'Confirmed';

INSERT INTO payments (booking_id, amount, method, status, paid_at)
SELECT booking_id,
       total_amount,
       (ARRAY['Card','Cash','Wallet','Online'])[1 + (booking_id % 4)],
       'Completed',
       booking_time
FROM bookings
WHERE status = 'Confirmed';

INSERT INTO staff_roles (role_name, base_salary) VALUES
('Manager',120000),('Cashier',55000),('Projectionist',70000),
('Cleaner',40000),('Usher',45000),('Concession Staff',48000);

INSERT INTO staff (cinema_id, role_id, full_name, phone, hire_date) VALUES
(1,1,'Kashif Mehmood','03211112222','2019-04-01'),
(1,2,'Rabia Sultan','03211113333','2019-05-10'),
(2,1,'Asad Jameel','03211114444','2020-08-01'),
(2,3,'Waqar Younis','03211115555','2020-09-15'),
(3,1,'Sadia Hameed','03211116666','2021-02-01'),
(3,5,'Junaid Latif','03211117777','2021-03-20'),
(4,1,'Naveed Akhtar','03211118888','2022-10-01'),
(4,6,'Mehwish Tariq','03211119999','2022-11-05');

INSERT INTO concession_items (name, category, price) VALUES
('Small Popcorn','Snack',350),('Large Popcorn','Snack',550),
('Nachos','Snack',450),('Soft Drink (Reg)','Drink',250),
('Soft Drink (Large)','Drink',350),('Bottled Water','Drink',120),
('Movie Combo A','Combo',800),('Movie Combo B','Combo',1100),
('Chocolate Bar','Snack',200),('Coffee','Drink',300);

INSERT INTO concession_orders (customer_id, cinema_id, order_time, total_amount) VALUES
(1,1,'2024-09-01 12:35',0),(2,1,'2024-09-01 12:50',0),
(3,2,'2024-09-01 16:00',0),(5,2,'2024-09-02 13:30',0),
(6,3,'2024-09-02 20:30',0),(8,4,'2024-09-03 17:30',0),
(9,4,'2024-09-03 20:00',0),(10,1,'2024-09-04 14:35',0),
(11,2,'2024-09-04 17:10',0),(1,3,'2024-09-05 19:00',0),
(2,4,'2024-09-06 21:30',0),(5,1,'2024-09-07 13:00',0);

INSERT INTO concession_order_items (corder_id, item_id, quantity, unit_price)
SELECT o.corder_id,
       ci.item_id,
       1 + (o.corder_id % 2)         AS quantity,
       ci.price                      AS unit_price
FROM concession_orders o
JOIN LATERAL (
    SELECT item_id, price
    FROM concession_items
    ORDER BY ((o.corder_id * 7) % 10) , item_id
    LIMIT (1 + (o.corder_id % 3))
) ci ON TRUE;

UPDATE concession_orders o
SET total_amount = sub.total
FROM (
    SELECT corder_id, SUM(quantity * unit_price) AS total
    FROM concession_order_items
    GROUP BY corder_id
) sub
WHERE o.corder_id = sub.corder_id;

INSERT INTO reviews (customer_id, movie_id, rating, comment, review_date) VALUES
(1,1,5,'Edge of my seat the whole time!','2024-09-02'),
(2,2,4,'Beautiful and emotional.','2024-09-02'),
(3,4,5,'Best sci-fi this year.','2024-09-03'),
(4,3,3,'Funny but a bit long.','2024-09-03'),
(5,5,4,'Genuinely scary.','2024-09-04'),
(6,8,5,'So romantic, loved it.','2024-09-04'),
(7,7,4,'Great thriller.','2024-09-05'),
(8,1,4,'Solid action.','2024-09-05'),
(9,9,3,'Decent but predictable.','2024-09-06'),
(10,6,5,'Kids loved it!','2024-09-06'),
(11,10,4,'Twist was great.','2024-09-07'),
(12,12,5,'Powerful courtroom drama.','2024-09-07'),
(1,4,4,'Visually stunning.','2024-09-08'),
(2,11,5,'Cute and fun.','2024-09-08'),
(5,2,4,'Nostalgic.','2024-09-09');

INSERT INTO promotions (code, description, discount_percent, valid_from, valid_to) VALUES
('WELCOME10','10% off first booking',10,'2024-09-01','2024-12-31'),
('STUDENT20','20% off with student ID',20,'2024-09-01','2025-06-30'),
('FAMILY15','15% off family of 4+',15,'2024-09-01','2024-11-30'),
('WEEKDAY25','25% off Mon-Thu shows',25,'2024-09-01','2024-10-31'),
('PLATINUM30','30% off for Platinum members',30,'2024-09-01','2025-01-31');