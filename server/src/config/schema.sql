//verbindung+aufgaben
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
//QR + machine statut
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    status VARCHAR(30) DEFAULT 'available',
    qr_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
//kalendar buchungen
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,

    project_name VARCHAR(150) NOT NULL,

    start_time TIMESTAMP NOT NULL,

    end_time TIMESTAMP NOT NULL,

    status VARCHAR(30) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
// Realistische Horloge für prüfungen
CREATE TABLE test_sessions (
    id SERIAL PRIMARY KEY,

    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,

    machine_id INTEGER REFERENCES machines(id) ON DELETE CASCADE,

    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    started_at TIMESTAMP,

    stopped_at TIMESTAMP,

    duration_seconds INTEGER DEFAULT 0,

    session_status VARCHAR(30) DEFAULT 'running',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);