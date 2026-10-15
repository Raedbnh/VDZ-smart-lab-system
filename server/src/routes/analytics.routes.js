const express = require('express');

const pool = require('../config/db');

const {
    verifyToken,
    verifyAdmin
} = require('../middleware/auth.middleware');

const router = express.Router();

router.get(
    '/dashboard',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            const users = await pool.query(
                'SELECT COUNT(*) FROM users'
            );

            const machines = await pool.query(
                'SELECT COUNT(*) FROM machines'
            );

            const bookings = await pool.query(
                'SELECT COUNT(*) FROM bookings'
            );

            const completed = await pool.query(
                `
                SELECT COUNT(*)
                FROM bookings
                WHERE status = 'completed'
                `
            );

            const duration = await pool.query(
                `
                SELECT
                    COALESCE(SUM(duration_seconds), 0) AS total
                FROM bookings
                `
            );

            res.json({
                users: Number(users.rows[0].count),
                machines: Number(machines.rows[0].count),
                bookings: Number(bookings.rows[0].count),
                completedTests: Number(completed.rows[0].count),
                totalDuration: Number(duration.rows[0].total)
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);

router.get(
    '/charts',
    verifyToken,
    verifyAdmin,
    async (req, res) => {
        try {
            const bookingsPerMachine = await pool.query(
                `
                SELECT
                    machines.name AS machine_name,
                    COUNT(bookings.id)::int AS bookings_count
                FROM machines
                LEFT JOIN bookings
                    ON machines.id = bookings.machine_id
                GROUP BY machines.id, machines.name
                ORDER BY bookings_count DESC
                `
            );

            const testTimePerMachine = await pool.query(
                `
                SELECT
                    machines.name AS machine_name,
                    COALESCE(SUM(bookings.duration_seconds), 0)::int AS total_seconds
                FROM machines
                LEFT JOIN bookings
                    ON machines.id = bookings.machine_id
                GROUP BY machines.id, machines.name
                ORDER BY total_seconds DESC
                `
            );

            const bookingsPerMonth = await pool.query(
                `
                SELECT
                    TO_CHAR(start_time, 'YYYY-MM') AS month,
                    COUNT(*)::int AS bookings_count
                FROM bookings
                GROUP BY month
                ORDER BY month ASC
                `
            );

            res.json({
                bookingsPerMachine: bookingsPerMachine.rows,
                testTimePerMachine: testTimePerMachine.rows,
                bookingsPerMonth: bookingsPerMonth.rows
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);

module.exports = router;