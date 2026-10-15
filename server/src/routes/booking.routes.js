// Reservierungs- und Testverwaltung
// Funktionen:
// - Reservierungen erstellen
// - Kalender anzeigen
// - Test starten
// - Test beenden
// - Historie anzeigen

const express = require('express');
const pool = require('../config/db');

const {
    verifyToken,
    verifyProjektleiter
} = require('../middleware/auth.middleware');

const router = express.Router();



router.get('/machine/:id', verifyToken, async (req, res) => {
    try {
        const bookings = await pool.query(
            `
            SELECT
                id,
                project_name,
                company,
                bemerkung,
                start_time,
                CASE
                    WHEN status = 'completed'
                        AND actual_end_time IS NOT NULL
                    THEN actual_end_time
                    ELSE end_time
                END AS end_time,
                status
            FROM bookings
            WHERE machine_id = $1
            ORDER BY start_time ASC
            `,
            [req.params.id]
        );

        const events = bookings.rows.map((booking) => ({
            id: booking.id,

            title:
                `${booking.project_name}`,

            start: booking.start_time,
            end: booking.end_time,

            color:
                booking.status === 'completed'
                    ? 'green'
                    : booking.status === 'running'
                        ? 'blue'
                        : booking.status === 'cancelled'
                            ? 'red'
                            : 'orange'
        }));

        res.json(events);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Serverfehler'
        });
    }
});




router.get('/my-bookings', verifyToken, async (req, res) => {
    try {

        const bookings = await pool.query(
            `
            SELECT
                bookings.id,
                bookings.project_name,
                bookings.company,
                bookings.bemerkung,

                bookings.start_time,
                bookings.end_time,

                bookings.actual_start_time,
                bookings.actual_end_time,
                bookings.duration_seconds,

                bookings.status,

                machines.name AS machine_name

            FROM bookings

            JOIN machines
                ON bookings.machine_id = machines.id

            WHERE bookings.user_id = $1

            ORDER BY bookings.start_time DESC
            `,
            [req.user.id]
        );

        res.json(bookings.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Serverfehler'
        });
    }
});




router.post(
    '/',
    verifyToken,
    verifyProjektleiter,

    async (req, res) => {
        try {

            const {
                machine_id,
                project_name,
                company,
                bemerkung,
                start_time,
                end_time
            } = req.body;


            // Pflichtfelder prüfen
            if (
                !machine_id ||
                !project_name ||
                !company ||
                !bemerkung ||
                !start_time ||
                !end_time
            ) {
                return res.status(400).json({
                    message:
                        'Bitte alle Pflichtfelder ausfüllen'
                });
            }


            // Zeit prüfen
            const timeCheck = await pool.query(
                `
                SELECT
                    $1::timestamp <
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE 'Europe/Berlin'
                    ) AS is_past,

                    $2::timestamp <=
                    $1::timestamp AS invalid_end
                `,
                [
                    start_time,
                    end_time
                ]
            );


            if (timeCheck.rows[0].is_past) {

                return res.status(400).json({
                    message:
                        'Reservierungen in der Vergangenheit sind nicht erlaubt'
                });
            }


            if (timeCheck.rows[0].invalid_end) {

                return res.status(400).json({
                    message:
                        'Die Endzeit muss nach der Startzeit liegen'
                });
            }


            // Maschine prüfen
            const machineResult = await pool.query(
                `
                SELECT status
                FROM machines
                WHERE id = $1
                `,
                [machine_id]
            );


            if (machineResult.rows.length === 0) {

                return res.status(404).json({
                    message:
                        'Maschine nicht gefunden'
                });
            }


            if (
                machineResult.rows[0].status ===
                'maintenance'
            ) {

                return res.status(400).json({
                    message:
                        'Diese Maschine ist in Wartung und kann nicht reserviert werden'
                });
            }


          

            const conflict = await pool.query(
                `
                SELECT
                    bookings.id,
                    bookings.project_name,
                    users.name AS project_leader_name
                FROM bookings
                JOIN users
                    ON bookings.user_id = users.id
                WHERE bookings.machine_id = $1
                AND bookings.status <> 'cancelled'
                AND bookings.start_time < $3
                AND (
                    CASE
                        WHEN bookings.status = 'completed'
                            AND bookings.actual_end_time IS NOT NULL
                        THEN bookings.actual_end_time
                        ELSE bookings.end_time
                    END
                ) > $2
                LIMIT 1
                `,
                [
                    machine_id,
                    start_time,
                    end_time
                ]
            );


            if (conflict.rows.length > 0) {
                return res.status(409).json({
                    message: 'Zeitraum schon reserviert',
                    project_leader_name:
                        conflict.rows[0].project_leader_name,
                    project_name:
                        conflict.rows[0].project_name
                });
            }


            // Reservierung speichern
            const newBooking = await pool.query(
                `
                INSERT INTO bookings
                (
                    user_id,
                    machine_id,

                    project_name,
                    company,
                    bemerkung,

                    start_time,
                    end_time,

                    status
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    'planned'
                )

                RETURNING *
                `,
                [
                    req.user.id,
                    machine_id,

                    project_name,
                    company,
                    bemerkung,

                    start_time,
                    end_time
                ]
            );


            res.status(201).json({

                message:
                    'Reservierung erstellt',

                booking:
                    newBooking.rows[0]

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: 'Serverfehler'
            });
        }
    }
);




router.post('/:id/start', verifyToken, async (req, res) => {
    try {

        const bookingId = req.params.id;


        const updatedBooking = await pool.query(
            `
            UPDATE bookings

            SET
                status = 'running',

                actual_start_time =
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE 'Europe/Berlin'
                    )

            WHERE id = $1

            AND status = 'planned'

            RETURNING *
            `,
            [bookingId]
        );


        if (updatedBooking.rows.length === 0) {

            return res.status(400).json({
                message:
                    'Der Test kann nicht gestartet werden'
            });
        }


        res.json({

            message:
                'Test gestartet',

            booking:
                updatedBooking.rows[0]

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Serverfehler'
        });
    }
});




router.post('/:id/stop', verifyToken, async (req, res) => {
    try {

        const bookingId = req.params.id;


        const updatedBooking = await pool.query(
            `
            UPDATE bookings

            SET
                status = 'completed',

                actual_end_time =
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE 'Europe/Berlin'
                    ),

                duration_seconds =
                    EXTRACT
                    (
                        EPOCH FROM
                        (
                            (
                                CURRENT_TIMESTAMP
                                AT TIME ZONE 'Europe/Berlin'
                            )
                            -
                            actual_start_time
                        )
                    )

            WHERE id = $1

            AND status = 'running'

            RETURNING *
            `,
            [bookingId]
        );


        if (updatedBooking.rows.length === 0) {

            return res.status(400).json({
                message:
                    'Dieser Test läuft nicht'
            });
        }


        res.json({

            message:
                'Test erfolgreich abgeschlossen',

            booking:
                updatedBooking.rows[0]

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Serverfehler'
        });
    }
});




router.get('/completed', verifyToken, async (req, res) => {
    try {

        const completedTests = await pool.query(
            `
            SELECT
                bookings.id,

                bookings.project_name,
                bookings.company,
                bookings.bemerkung,

                bookings.status,

                bookings.duration_seconds,
                bookings.actual_start_time,
                bookings.actual_end_time,

                machines.name AS machine_name,

                users.name AS user_name

            FROM bookings

            JOIN machines
                ON bookings.machine_id =
                   machines.id

            JOIN users
                ON bookings.user_id =
                   users.id

            WHERE bookings.status =
                  'completed'

            ORDER BY
                bookings.actual_end_time DESC
            `
        );


        res.json(completedTests.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Serverfehler'
        });
    }
});




router.delete('/:id', verifyToken, async (req, res) => {
    try {

        const bookingId =
            req.params.id;


        const bookingResult =
            await pool.query(
                `
                SELECT *
                FROM bookings
                WHERE id = $1
                `,
                [bookingId]
            );


        if (
            bookingResult.rows.length === 0
        ) {

            return res.status(404).json({
                message:
                    'Reservierung nicht gefunden'
            });
        }


        const booking =
            bookingResult.rows[0];


        if (
            req.user.role !== 'admin' &&
            Number(booking.user_id) !==
            Number(req.user.id)
        ) {

            return res.status(403).json({
                message:
                    'Keine Berechtigung'
            });
        }


        if (
            booking.status === 'running' ||
            booking.status === 'completed'
        ) {

            return res.status(400).json({
                message:
                    'Laufende oder abgeschlossene Tests können nicht storniert werden'
            });
        }


        if (
            booking.status === 'cancelled'
        ) {

            return res.status(400).json({
                message:
                    'Diese Reservierung wurde bereits storniert'
            });
        }


        const cancelledBooking =
            await pool.query(
                `
                UPDATE bookings

                SET status = 'cancelled'

                WHERE id = $1

                RETURNING *
                `,
                [bookingId]
            );


        res.json({

            message:
                'Reservierung erfolgreich storniert',

            booking:
                cancelledBooking.rows[0]

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Serverfehler'
        });
    }
});


// ======================================================
// Balkendiagramm / Tagesübersicht
// ======================================================

router.get(
    '/daily-machine-plan',
    verifyToken,

    async (req, res) => {
        try {


            const selectedDate =
                req.query.date ||
                new Date().toLocaleDateString(
                    'en-CA',
                    {
                        timeZone: 'Europe/Berlin'
                    }
                );


            const result = await pool.query(
                `
                SELECT

                    machines.id
                        AS machine_id,

                    machines.name
                        AS machine_name,

                    machines.status
                        AS machine_status,


                    bookings.id
                        AS booking_id,

                    bookings.project_name,

                    bookings.company,

                    bookings.bemerkung,


                    bookings.start_time,

                    bookings.end_time,

                    bookings.actual_start_time,

                    bookings.actual_end_time,

                    bookings.duration_seconds,

                    bookings.status
                        AS booking_status,


                    users.name
                        AS project_leader_name


                FROM machines


                LEFT JOIN bookings

                    ON machines.id =
                       bookings.machine_id


                    -- ==========================================
                    -- Reservierung muss den ausgewählten
                    -- Tag überschneiden.
                    --
                    -- Beispiel:
                    --
                    -- Start:
                    -- 13.10.2026 15:00
                    --
                    -- Ende:
                    -- 16.10.2026 15:00
                    --
                    -- Die Reservierung wird dadurch am
                    -- 13., 14., 15. und 16. angezeigt.
                    -- ==========================================

                    AND bookings.start_time <
                        (
                            $1::date +
                            INTERVAL '1 day'
                        )

                    AND
                    (
                        CASE

                            WHEN
                                bookings.status =
                                'completed'

                                AND
                                bookings.actual_end_time
                                IS NOT NULL

                            THEN
                                bookings.actual_end_time

                            ELSE
                                bookings.end_time

                        END
                    ) >= $1::date


                LEFT JOIN users

                    ON bookings.user_id =
                       users.id


                ORDER BY

                    CASE

                        WHEN bookings.status =
                             'running'
                        THEN 0

                        WHEN bookings.status =
                             'planned'
                        THEN 1

                        WHEN bookings.id IS NULL
                        THEN 2

                        ELSE 3

                    END,

                    bookings.start_time,

                    machines.name
                `,
                [
                    selectedDate
                ]
            );


            res.json(result.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message:
                    'Serverfehler'
            });
        }
    }
);


module.exports = router;