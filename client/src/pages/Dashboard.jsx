


import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const GANTT_START_HOUR = 6;
const GANTT_END_HOUR = 20;
const GANTT_TOTAL_HOURS = GANTT_END_HOUR - GANTT_START_HOUR;

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDuration(seconds) {
    const safeSeconds = Math.max(
        0,
        Math.floor(Number(seconds) || 0)
    );

    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;

    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(secs).padStart(2, '0')
    ].join(':');
}

function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user'));

    const [stats, setStats] = useState({
        users: 0,
        machines: 0,
        bookings: 0,
        completedTests: 0,
        totalDuration: 0
    });

    const [dailyPlan, setDailyPlan] = useState([]);
    const [showCancelled, setShowCancelled] = useState(false);

    const [selectedDate, setSelectedDate] = useState(
        () => formatLocalDate(new Date())
    );

    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [planError, setPlanError] = useState('');

    // Chronometer jede Sekunde aktualisieren
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Dashboard-Statistiken laden
    useEffect(() => {
        fetchStats();
    }, []);

    // Tagesplan laden und alle 15 Sekunden aktualisieren
    useEffect(() => {
        fetchDailyPlan(selectedDate);

        const refreshTimer = setInterval(() => {
            fetchDailyPlan(selectedDate);
        }, 15000);

        return () => clearInterval(refreshTimer);
    }, [selectedDate]);

    async function fetchStats() {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(
                'http://localhost:5000/api/analytics/dashboard',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setStats(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchDailyPlan(date) {
        try {
            setLoading(true);
            setPlanError('');

            const token = localStorage.getItem('token');

            const response = await axios.get(
                'http://localhost:5000/api/bookings/daily-machine-plan',
                {
                    params: { date },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setDailyPlan(response.data);
        } catch (error) {
            console.error(error);
            setPlanError(
                'Tagesübersicht konnte nicht geladen werden.'
            );
        } finally {
            setLoading(false);
        }
    }

    function changeDay(offset) {
        const date = new Date(`${selectedDate}T12:00:00`);

        date.setDate(date.getDate() + offset);

        setSelectedDate(formatLocalDate(date));
    }

    function getPlannedDuration(startTime, endTime) {
        if (!startTime || !endTime) {
            return '-';
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        const seconds = Math.max(
            0,
            Math.floor(
                (end.getTime() - start.getTime()) / 1000
            )
        );

        return formatDuration(seconds);
    }

    function getActualRunningSeconds(reservation) {
        if (!reservation.actual_start_time) {
            return 0;
        }

        const actualStart = new Date(
            reservation.actual_start_time
        );

        if (Number.isNaN(actualStart.getTime())) {
            return 0;
        }

        return Math.max(
            0,
            Math.floor(
                (currentTime.getTime() - actualStart.getTime()) / 1000
            )
        );
    }

    function getReservationDuration(reservation) {
        if (reservation.booking_status === 'running') {
            return formatDuration(
                getActualRunningSeconds(reservation)
            );
        }

        if (reservation.booking_status === 'completed') {
            if (reservation.duration_seconds != null) {
                return formatDuration(
                    reservation.duration_seconds
                );
            }

            if (
                reservation.actual_start_time &&
                reservation.actual_end_time
            ) {
                const start = new Date(
                    reservation.actual_start_time
                );

                const end = new Date(
                    reservation.actual_end_time
                );

                return formatDuration(
                    (end.getTime() - start.getTime()) / 1000
                );
            }
        }

        return getPlannedDuration(
            reservation.start_time,
            reservation.end_time
        );
    }

    // Tatsächliche Start- und Endzeit verwenden
    function getVisibleReservationTimes(reservation) {
        let reservationStart = new Date(
            reservation.start_time
        );

        let reservationEnd = new Date(
            reservation.end_time
        );

        if (
            reservation.booking_status === 'completed' &&
            reservation.actual_start_time &&
            reservation.actual_end_time
        ) {
            reservationStart = new Date(
                reservation.actual_start_time
            );

            reservationEnd = new Date(
                reservation.actual_end_time
            );
        }

        const [year, month, day] = selectedDate
            .split('-')
            .map(Number);

        const dayStart = new Date(
            year,
            month - 1,
            day,
            GANTT_START_HOUR,
            0,
            0
        );

        const dayEnd = new Date(
            year,
            month - 1,
            day,
            GANTT_END_HOUR,
            0,
            0
        );

        if (
            Number.isNaN(reservationStart.getTime()) ||
            Number.isNaN(reservationEnd.getTime())
        ) {
            return null;
        }

        const visibleStart = new Date(
            Math.max(
                reservationStart.getTime(),
                dayStart.getTime()
            )
        );

        const visibleEnd = new Date(
            Math.min(
                reservationEnd.getTime(),
                dayEnd.getTime()
            )
        );

        if (visibleEnd <= visibleStart) {
            return null;
        }

        return {
            start: visibleStart,
            end: visibleEnd
        };
    }

    function getBlockStyle(reservation) {
        const visible = getVisibleReservationTimes(reservation);

        if (!visible) {
            return null;
        }

        const dayStart = new Date(
            `${selectedDate}T06:00:00`
        );

        const top =
            (
                (visible.start.getTime() - dayStart.getTime()) /
                (1000 * 60 * 60)
            ) /
            GANTT_TOTAL_HOURS * 100;

        const height =
            (
                (visible.end.getTime() - visible.start.getTime()) /
                (1000 * 60 * 60)
            ) /
            GANTT_TOTAL_HOURS * 100;

        return {
            top: `${Math.max(0, top)}%`,
            height: `${Math.max(0, height)}%`
        };
    }

    function groupBookingsByMachine(plan) {
        const machinesMap = new Map();

        plan.forEach((item) => {
            if (!machinesMap.has(item.machine_id)) {
                machinesMap.set(item.machine_id, {
                    machine_id: item.machine_id,
                    machine_name: item.machine_name,
                    machine_status: item.machine_status,
                    reservations: []
                });
            }

            if (item.booking_id) {
                machinesMap.get(item.machine_id)
                    .reservations.push({
                        booking_id: item.booking_id,
                        project_name: item.project_name,
                        company: item.company,
                        bemerkung: item.bemerkung,
                        project_leader_name: item.project_leader_name,
                        start_time: item.start_time,
                        end_time: item.end_time,
                        actual_start_time: item.actual_start_time,
                        actual_end_time: item.actual_end_time,
                        duration_seconds: item.duration_seconds,
                        booking_status: item.booking_status
                    });
            }
        });

        const groupedMachines = Array.from(
            machinesMap.values()
        );

        groupedMachines.forEach((machine) => {
            machine.reservations.sort(
                (a, b) =>
                    new Date(a.start_time).getTime() -
                    new Date(b.start_time).getTime()
            );
        });

        function getMachinePriority(machine) {
            if (
                machine.reservations.some(
                    (reservation) =>
                        reservation.booking_status === 'running'
                )
            ) {
                return 0;
            }

            if (
                machine.reservations.some(
                    (reservation) =>
                        reservation.booking_status === 'planned'
                )
            ) {
                return 1;
            }

            if (machine.reservations.length === 0) {
                return 2;
            }

            return 3;
        }

        return groupedMachines.sort((a, b) => {
            const priorityDifference =
                getMachinePriority(a) -
                getMachinePriority(b);

            if (priorityDifference !== 0) {
                return priorityDifference;
            }

            return a.machine_name.localeCompare(
                b.machine_name,
                'de'
            );
        });
    }

    const groupedMachines = groupBookingsByMachine(dailyPlan);

    const filteredMachines = groupedMachines.map((machine) => ({
        ...machine,
        reservations: machine.reservations.filter(
            (reservation) => {
                if (showCancelled) {
                    return true;
                }

                return reservation.booking_status !== 'cancelled';
            }
        )
    }));

    function getBlockClass(status) {
        if (status === 'completed') {
            return 'gantt-block completed';
        }

        if (status === 'cancelled') {
            return 'gantt-block cancelled';
        }

        if (status === 'running') {
            return 'gantt-block running';
        }

        return 'gantt-block occupied';
    }

    const timeLabels = Array.from(
        { length: GANTT_TOTAL_HOURS + 1 },
        (_, index) => {
            const hour = GANTT_START_HOUR + index;

            return `${String(hour).padStart(2, '0')}:00`;
        }
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-content">
                <h1>
                    {user?.role === 'projektleiter'
                        ? 'Projektleiter Dashboard'
                        : 'Admin Dashboard'}
                </h1>

                <p>
                    Willkommen, {user?.name}
                </p>

                {/* Admin Dashboard */}
                {user?.role === 'admin' && (
                    <div className="row mt-4">
                        <div className="col-md-4 mb-4">
                            <div className="card p-4 shadow">
                                <h3>{stats.users}</h3>
                                <p>Benutzer</p>
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <div className="card p-4 shadow">
                                <h3>{stats.machines}</h3>
                                <p>Maschinen</p>
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <div className="card p-4 shadow">
                                <h3>{stats.bookings}</h3>
                                <p>Buchungen</p>
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <div className="card p-4 shadow">
                                <h3>{stats.completedTests}</h3>
                                <p>Abgeschlossene Tests</p>
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <div className="card p-4 shadow">
                                <h3>
                                    {formatDuration(stats.totalDuration)}
                                </h3>
                                <p>Gesamte Testzeit</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projektleiter Dashboard */}
                {user?.role === 'projektleiter' && (
                    <div className="card shadow p-4 mt-4">
                        <h3 className="mb-3">
                            Tagesübersicht der Maschinen
                        </h3>

                        <p>
                            Abgeschlossene Tests werden grün,
                            geplante Reservierungen gelb,
                            laufende Tests blau und
                            stornierte Reservierungen rot angezeigt.
                            Die Zeitachse geht von 06:00 bis 20:00 Uhr.
                        </p>

                        {/* Datum auswählen */}
                        <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
                            <div>
                                <label className="form-label">
                                    Datum
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                />
                            </div>

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => changeDay(-1)}
                            >
                                ← Vorheriger Tag
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                    setSelectedDate(
                                        formatLocalDate(new Date())
                                    )
                                }
                            >
                                Heute
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => changeDay(1)}
                            >
                                Nächster Tag →
                            </button>
                        </div>

                        <div className="d-flex align-items-center gap-2 mb-3">
                            <input
                                type="checkbox"
                                id="showCancelled"
                                checked={showCancelled}
                                onChange={(e) =>
                                    setShowCancelled(e.target.checked)
                                }
                            />

                            <label htmlFor="showCancelled">
                                Stornierte Einträge anzeigen
                            </label>
                        </div>

                        {planError && (
                            <div className="alert alert-danger">
                                {planError}
                            </div>
                        )}

                        {loading && (
                            <p className="text-muted">
                                Tagesübersicht wird geladen...
                            </p>
                        )}

                        {/* Gantt-Diagramm */}
                        <div className="gantt-wrapper">
                            <div className="gantt-time-axis">
                                {timeLabels.map((time) => (
                                    <div
                                        key={time}
                                        className="gantt-time-label"
                                    >
                                        {time}
                                    </div>
                                ))}
                            </div>

                            <div className="gantt-machines">
                                {filteredMachines.map((machine) => (
                                    <div
                                        className="gantt-machine"
                                        key={machine.machine_id}
                                    >
                                        <div className="gantt-column">
                                            {machine.reservations.map(
                                                (reservation) => {
                                                    const blockStyle =
                                                        getBlockStyle(
                                                            reservation
                                                        );

                                                    if (!blockStyle) {
                                                        return null;
                                                    }

                                                    const isRunning =
                                                        reservation.booking_status ===
                                                        'running';

                                                    // Schriftgröße abhängig von Balkenhöhe
                                                    const blockHeight = parseFloat(blockStyle.height);

                                                    const blockHeightPx = (blockHeight / 100) * 700;

                                                    const projectFontSize =
                                                        blockHeightPx < 12
                                                            ? '7px'
                                                            : blockHeightPx < 20
                                                                ? '9px'
                                                                : blockHeightPx < 35
                                                                    ? '11px'
                                                                    : '14px';

                                                    const smallBlock =
                                                        blockHeight < 2;

                                                    return (
                                                        <div
                                                            key={
                                                                reservation.booking_id
                                                            }
                                                            className={
                                                                getBlockClass(
                                                                    reservation.booking_status
                                                                )
                                                            }
                                                            style={{
                                                                ...blockStyle,
                                                                overflow: 'visible',
                                                                boxSizing: 'border-box',
                                                                
                                                            }}
                                                        >
                                                            {/* Projektnummer */}
                                                            <strong
                                                                style={{
                                                                    
                                                                    fontSize:
                                                                        projectFontSize,
                                                                    lineHeight: '1',
                                                                    margin: 0,
                                                                    padding: 0,
                                                                }}
                                                            >
                                                                {
                                                                    reservation.project_name
                                                                }
                                                            </strong>

                                                            {/* Laufzeit */}
                                                            {isRunning && (
                                                                <div
                                                                    style={{
                                                                        marginTop: smallBlock
                                                                            ? '0px'
                                                                            : '4px',
                                                                        fontWeight: 'bold',
                                                                        fontSize: smallBlock
                                                                            ? '8px'
                                                                            : '0.8rem',
                                                                        fontVariantNumeric:
                                                                            'tabular-nums',
                                                                        whiteSpace:
                                                                            'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow:
                                                                            'ellipsis'
                                                                    }}
                                                                >
                                                                    {formatDuration(
                                                                        getActualRunningSeconds(
                                                                            reservation
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Hover-Details */}
                                                            <div className="gantt-tooltip">
                                                                <div className="gantt-tooltip-title">
                                                                    Prüfungsdetails
                                                                </div>

                                                                <div>
                                                                    <strong>
                                                                        Projektleiter:
                                                                    </strong>{' '}
                                                                    {
                                                                        reservation.project_leader_name ||
                                                                        '-'
                                                                    }
                                                                </div>

                                                                <div>
                                                                    <strong>
                                                                        Projektnr.:
                                                                    </strong>{' '}
                                                                    {
                                                                        reservation.project_name ||
                                                                        '-'
                                                                    }
                                                                </div>

                                                                <div>
                                                                    <strong>
                                                                        Kunde:
                                                                    </strong>{' '}
                                                                    {
                                                                        reservation.company ||
                                                                        '-'
                                                                    }
                                                                </div>

                                                                <div>
                                                                    <strong>
                                                                        Aktuelle Laufzeit:
                                                                    </strong>{' '}
                                                                    {isRunning
                                                                        ? formatDuration(
                                                                            getActualRunningSeconds(
                                                                                reservation
                                                                            )
                                                                        )
                                                                        : '-'}
                                                                </div>

                                                                <div>
                                                                    <strong>
                                                                        Dauer:
                                                                    </strong>{' '}
                                                                    {getReservationDuration(
                                                                        reservation
                                                                    )}
                                                                </div>

                                                                <div>
                                                                    <strong>
                                                                        Bemerkung:
                                                                    </strong>{' '}
                                                                    {
                                                                        reservation.bemerkung ||
                                                                        '-'
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>

                                        <div className="gantt-machine-name">
                                            {machine.machine_name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legende */}
                        <div className="mt-3">
                            <span className="badge bg-success me-2">
                                Abgeschlossen
                            </span>

                            <span className="badge bg-warning text-dark me-2">
                                Belegt
                            </span>

                            <span className="badge bg-primary me-2">
                                Läuft
                            </span>

                            <span className="badge bg-danger">
                                Storniert
                            </span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;


