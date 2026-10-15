// Maschinenverwaltung
// Funktionen:
// - Maschinen anzeigen
// - Maschine hinzufügen
// - Bearbeiten
// - Löschen
// - QR-Code generieren
const express = require('express');
const QRCode = require('qrcode');

const pool = require('../config/db');

const {
    verifyToken,
    verifyAdmin
} = require('../middleware/auth.middleware');

const router = express.Router();
// Aktualisiert eine vorhandene Maschine
router.get(
    '/',
    verifyToken,
    async (req, res) => {

        try {

            const machines = await pool.query(
                'SELECT * FROM machines ORDER BY id ASC'
            );

            res.json(machines.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);
// Löscht eine Maschine aus der Datenbank
router.post(
    '/',
    verifyToken,
    verifyAdmin,
    async (req, res) => {

        try {

            const {
                name,
                location,
                status
            } = req.body;

            const newMachine = await pool.query(
                `
                INSERT INTO machines
                (name, location, status)
                VALUES ($1, $2, $3)
                RETURNING *
                `,
                [name, location, status]
            );

            res.status(201).json({
                message: 'Maschine erstellt',
                machine: newMachine.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);
// Maschinen mit Tests für einen ausgewählten Zeitraum anzeigen
router.get(
    '/with-tests',
    verifyToken,
    async (req, res) => {
        try {
            const { from, to } = req.query;

            if (!from || !to) {
                return res.status(400).json({
                    message: 'Von- und Bis-Datum sind erforderlich'
                });
            }

            const result = await pool.query(
                `
                SELECT
                    machines.id,
                    machines.name,
                    machines.location,
                    machines.status,

                    bookings.id AS booking_id,
                    bookings.project_name,
                    bookings.company,
                    bookings.test_level,
                    bookings.start_time,
                    bookings.end_time,
                    bookings.actual_start_time,
                    bookings.actual_end_time,
                    bookings.duration_seconds,
                    bookings.status AS booking_status,

                    users.name AS project_leader_name

                FROM machines

                LEFT JOIN bookings
                    ON machines.id = bookings.machine_id

                    AND bookings.start_time::date
                        BETWEEN $1::date AND $2::date

                LEFT JOIN users
                    ON bookings.user_id = users.id

                ORDER BY
                    machines.id ASC,
                    bookings.start_time ASC
                `,
                [from, to]
            );

            const machinesMap = new Map();

            result.rows.forEach((row) => {
                if (!machinesMap.has(row.id)) {
                    machinesMap.set(row.id, {
                        id: row.id,
                        name: row.name,
                        location: row.location,
                        status: row.status,
                        tests: []
                    });
                }

                if (row.booking_id) {
                    machinesMap.get(row.id).tests.push({
                        id: row.booking_id,

                        project_name: row.project_name,
                        company: row.company,
                        test_level: row.test_level,

                        project_leader_name:
                            row.project_leader_name,

                        start_time: row.start_time,
                        end_time: row.end_time,

                        actual_start_time:
                            row.actual_start_time,

                        actual_end_time:
                            row.actual_end_time,

                        duration_seconds:
                            row.duration_seconds,

                        status:
                            row.booking_status
                    });
                }
            });

            res.json(
                Array.from(machinesMap.values())
            );

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);
router.get(
    '/:id/tests',
    verifyToken,
    async (req, res) => {
        try {
            const machineId = req.params.id;
            const { from, to } = req.query;

            if (!from || !to) {
                return res.status(400).json({
                    message: 'Von- und Bis-Datum sind erforderlich'
                });
            }

            const tests = await pool.query(
                `
                SELECT
                    bookings.id,
                    bookings.project_name,
                    bookings.company,
                    bookings.test_level,
                    bookings.start_time,
                    bookings.end_time,
                    bookings.actual_start_time,
                    bookings.actual_end_time,
                    bookings.duration_seconds,
                    bookings.status,
                    users.name AS project_leader_name
                FROM bookings
                JOIN users
                    ON bookings.user_id = users.id
                WHERE bookings.machine_id = $1
                AND bookings.start_time::date
                    BETWEEN $2::date AND $3::date
                ORDER BY bookings.start_time DESC
                `,
                [
                    machineId,
                    from,
                    to
                ]
            );

            res.json(tests.rows);

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);
// Erstellt einen QR-Code für eine Maschine
// Der QR-Code öffnet:
// /machines/:id/today-tasks
router.get(
    '/:id/qrcode',
    verifyToken,
    async (req, res) => {

        try {

            const machineId = req.params.id;

            const todayTasksUrl =
                `http://192.168.32.43:5173/machines/${machineId}/today-tasks`;

            const qrCode =
                await QRCode.toDataURL(todayTasksUrl);

            res.json({
                machineId,
                todayTasksUrl,
                qrCode
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: 'QR-Code Fehler'
            });
        }
    }
);

router.put(
    '/:id',
    verifyToken,
    verifyAdmin,
    async (req, res) => {

        try {

            const {
                name,
                location,
                status
            } = req.body;

            const updatedMachine = await pool.query(
                `
                UPDATE machines
                SET
                    name = $1,
                    location = $2,
                    status = $3
                WHERE id = $4
                RETURNING *
                `,
                [
                    name,
                    location,
                    status,
                    req.params.id
                ]
            );

            if (updatedMachine.rows.length === 0) {

                return res.status(404).json({
                    message: 'Maschine nicht gefunden'
                });
            }

            res.json({
                message: 'Maschine aktualisiert',
                machine: updatedMachine.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);

router.delete(
    '/:id',
    verifyToken,
    verifyAdmin,
    async (req, res) => {

        try {

            const deletedMachine = await pool.query(
                `
                DELETE FROM machines
                WHERE id = $1
                RETURNING *
                `,
                [req.params.id]
            );

            if (deletedMachine.rows.length === 0) {

                return res.status(404).json({
                    message: 'Maschine nicht gefunden'
                });
            }

            res.json({
                message: 'Maschine gelöscht'
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
    '/:id/today-tasks',
    verifyToken,
    async (req, res) => {
        try {
            const machineId = req.params.id;

            const tasks = await pool.query(
                `
                SELECT
                    bookings.id,
                    bookings.project_name,
                    bookings.start_time,
                    bookings.end_time,
                    bookings.status,
                    users.name AS user_name
                FROM bookings
                JOIN users
                    ON bookings.user_id = users.id
                WHERE machine_id = $1
                AND start_time::date = CURRENT_DATE
                ORDER BY start_time ASC
                `,
                [machineId]
            );

            res.json(tasks.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);
module.exports = router;