CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('customer','vendor','driver')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE customers (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vendors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vendor_name TEXT,
  contact_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE drivers (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  driver_name TEXT,
  phone_number TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES users(id),
  driver_id UUID REFERENCES users(id),
  pickup_location TEXT NOT NULL,
  drop_location TEXT NOT NULL,
  requested_vehicle_type TEXT CHECK (requested_vehicle_type IN ('mini','sedan','suv','luxury')),
  distance_km NUMERIC NOT NULL,
  total_amount NUMERIC,
  status TEXT CHECK (
    status IN ('requested','accepted','assigned','ongoing','completed','cancelled')
  ) DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  method TEXT CHECK (method IN ('cash','online')),
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending','paid')) DEFAULT 'pending',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE bookings
ADD COLUMN final_notification_sent BOOLEAN DEFAULT false;
ALTER TABLE bookings
ADD COLUMN target_pickup_time TIMESTAMP,
ADD COLUMN payment_mode TEXT CHECK (payment_mode IN ('cash','online')); 
DELETE from bookings;
SELECT * FROM bookings;

ALTER TABLE bookings
ALTER COLUMN payment_mode SET NOT NULL,
ALTER COLUMN target_pickup_time SET NOT NULL;

ALTER TABLE bookings
ADD COLUMN priority TEXT;

UPDATE bookings
SET priority = CASE
  WHEN target_pickup_time <= NOW() + INTERVAL '3 hours'
  THEN 'HIGH'
  ELSE 'NORMAL'
END;


CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type TEXT CHECK (vehicle_type IN ('mini','sedan','suv','luxury')),
  plate_number TEXT UNIQUE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);


ALTER TABLE bookings
DROP COLUMN vehicle_id;

ALTER TABLE bookings
ADD COLUMN vehicle_id UUID REFERENCES vehicles(id);

ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;


CREATE TABLE driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers(user_id) ON DELETE CASCADE,
  shift_start TIMESTAMP NOT NULL,
  shift_end TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (shift_end > shift_start)
);

CREATE TABLE emergency_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  cancelled_by UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('customer','vendor','driver')),
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('customer','vendor','driver')),
  old_status TEXT,
  new_status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);


select * from users;

-- Notifications
DELETE FROM notifications;

-- Emergency cancellations
DELETE FROM emergency_cancellations;

-- Payments
DELETE FROM payments;

-- Bookings
DELETE FROM bookings;

-- Drivers (availability + shifts depend on this)
DELETE FROM driver_shifts;
DELETE FROM drivers;

-- Vendors & customers
DELETE FROM vendors;
DELETE FROM customers;

DELETE FROM users;

SELECT id, email
FROM users
WHERE role = 'vendor';

SELECT * FROM vehicles;

INSERT INTO vehicles (
  vendor_id,
  vehicle_type,
  plate_number,
  is_available
)
VALUES
('3ecb7dbc-53a1-4a41-ba82-54b571741a28', 'mini',   'KA01AA1111', true),
('3ecb7dbc-53a1-4a41-ba82-54b571741a28', 'sedan',  'KA01AA2222', true),
('3ecb7dbc-53a1-4a41-ba82-54b571741a28', 'suv',    'KA01AA3333', true),
('3ecb7dbc-53a1-4a41-ba82-54b571741a28', 'luxury', 'KA01AA4444', true);

SELECT vehicle_type, plate_number, is_available
FROM vehicles
WHERE vendor_id = '3ecb7dbc-53a1-4a41-ba82-54b571741a28';

SELECT * FROM bookings;
SELECT * FROM payments;
SELECT * FROM drivers;
SELECT * FROM vehicles;
SELECT * FROM audit_logs;
SELECT * FROM notifications;
SELECT * FROM vendors;

SELECT
  pid,
  state,
  wait_event_type,
  wait_event,
  query
FROM pg_stat_activity
WHERE state != 'idle';

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction';

SELECT pid, state, wait_event_type, wait_event
FROM pg_stat_activity
WHERE state != 'idle';

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid();


select * from vehicles;
select * from drivers;

update vehicles 
set is_available = 'true';

update drivers 
set is_available = 'true';

select * from users;
select * from vendors;

SELECT vendor_id,status
FROM bookings
WHERE id = '177c6a64-a654-4d14-a651-9e68047a19be';


SELECT * FROM bookings;
DELETE FROM bookings;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  role TEXT NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);


ALTER TABLE payments
ADD CONSTRAINT payments_booking_id_unique UNIQUE (booking_id);


ALTER TABLE bookings
DROP CONSTRAINT bookings_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN (
  'requested',
  'accepted',
  'assigned',
  'started',
  'completed',
  'cancelled',
  'expired'
));


INSERT INTO payments (booking_id, method, amount, status, verified)
VALUES (
  '177c6a64-a654-4d14-a651-9e68047a19be',
  'online',
  500,
  'pending',
  false
);


SELECT * FROM payments;

SELECT status, completed_at
FROM bookings
WHERE id = 'f3529cc6-0ec9-49ee-8b55-7864debdd7a9';

ALTER TABLE users
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expiry TIMESTAMP;


ALTER TABLE bookings
DROP CONSTRAINT bookings_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN (
  'requested',
  'accepted',
  'assigned',
  'started',
  'completed',
  'cancelled',
  'rejected',
  'expired'
));

ALTER TABLE drivers
ALTER COLUMN vendor_id SET NOT NULL;

UPDATE vehicles
SET vendor_id = '847fd430-4381-45b4-9c06-8d7993c4cf59';

ALTER TABLE drivers
ADD CONSTRAINT drivers_vendor_fk
FOREIGN KEY (vendor_id)
REFERENCES users(id)
ON DELETE CASCADE;

SELECT user_id, vendor_id, is_available
FROM drivers
WHERE vendor_id = '847fd430-4381-45b4-9c06-8d7993c4cf59';


-- 1. Clear dependent tables first
DELETE FROM notifications;
DELETE FROM payments;

-- 2. Clear bookings
DELETE FROM bookings;

-- 3. Reset vehicles availability
UPDATE vehicles
SET is_available = true;

-- 4. Reset drivers availability
UPDATE drivers
SET is_available = true;

SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM payments;
SELECT COUNT(*) FROM notifications;

SELECT
  status,
  payment_mode,
  vendor_id,
  driver_id,
  vehicle_id
FROM bookings;

UPDATE bookings SET status = 'started' WHERE status = 'ongoing';

SELECT user_id, vendor_id FROM drivers;

select * from users;

SELECT * FROM bookings;
SELECT * FROM payments;
SELECT * FROM notifications;
SELECT * FROM drivers;
SELECT * FROM vehicles;

delete from bookings;

SELECT driver_name, is_available FROM drivers;

SELECT vehicle_type, plate_number, is_available FROM vehicles;

DELETE FROM notifications;
DELETE FROM payments;
DELETE FROM bookings;

UPDATE drivers SET is_available = true;
UPDATE vehicles SET is_available = true;
