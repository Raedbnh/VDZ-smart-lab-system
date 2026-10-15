// Authentifizierung und Benutzerverwaltung
//
// Funktionen:
// - Registrierung
// - Login
// - Profilinformationen
const express = require('express');
const bcrypt = require('bcrypt');

const pool = require('../config/db');

const {
    verifyToken,
    verifyAdmin
} = require('../middleware/auth.middleware');

const { register, login } = require('../controllers/auth');

const router = express.Router();
// Erstellt einen neuen Benutzer
// Eingaben:
// - Name
// - E-Mail
// - Passwort
// Ausgabe:
// - Neuer Benutzer in der Datenbank
router.post('/register', register );
// Benutzeranmeldung
// Prüft:
// - E-Mail
// - Passwort
// Gibt ein JWT-Token zurück
router.post('/login', login );
// Geschütztes Benutzerprofil
// Nur für angemeldete Benutzer verfügbar
router.get('/profile', verifyToken, (req, res) => {
    res.json({
        message: 'Geschütztes Profil',
        user: req.user
    });
});
// Gibt alle Benutzer zurück
// Nur Administratoren dürfen diese Daten sehen
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const users = await pool.query(
            `
            SELECT id, name, email, role, created_at
            FROM users
            ORDER BY id ASC
            `
        );

        res.json(users.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Serverfehler'
        });
    }
});

router.post('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: 'Benutzer existiert bereits'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role
            `,
            [name, email, passwordHash, role]
        );

        res.status(201).json({
            message: 'Benutzer erfolgreich erstellt',
            user: newUser.rows[0]
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Serverfehler'
        });
    }
});
module.exports = router;