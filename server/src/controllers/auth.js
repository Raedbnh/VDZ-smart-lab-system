
const pool = require('../config/db')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

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
            INSERT INTO users (name, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, role
            `,
            [name, email, passwordHash]
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
}


const login=async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                message: 'Ungültige E-Mail oder Passwort'
            });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                message: 'Ungültige E-Mail oder Passwort'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        res.json({
            message: 'Login erfolgreich',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Serverfehler'
        });
    }
}

module.exports = { register,login }