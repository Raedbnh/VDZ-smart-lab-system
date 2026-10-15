// Buchungsdashboard
// Projektleiter können:
// - Maschinen auswählen
// - Kalender anzeigen
// - Reservierungen erstellen
// - Eigene Reservierungen verwalten


import { useEffect, useState } from 'react';
import axios from 'axios';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import Sidebar from '../components/Sidebar';

function Bookings() {
    const [machines, setMachines] = useState([]);
    const [selectedMachine, setSelectedMachine] = useState('');
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [myBookings, setMyBookings] = useState([]);

    const [projectName, setProjectName] = useState('');
    const [company, setCompany] = useState('');
    const [bemerkung, setBemerkung] = useState('');

    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [durationHours, setDurationHours] = useState('');

    const [message, setMessage] = useState('');
    const [bookingError, setBookingError] = useState(null);

    useEffect(() => {
        fetchMachines();
        fetchMyBookings();
    }, []);

    useEffect(() => {
        if (selectedMachine) {
            fetchMachineBookings(selectedMachine);
        } else {
            setCalendarEvents([]);
        }
    }, [selectedMachine]);

    // Alle verfügbaren Maschinen laden
    async function fetchMachines() {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(
                'http://localhost:5000/api/machines',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMachines(response.data);
        } catch (error) {
            console.error('Fehler beim Laden der Maschinen:', error);
        }
    }

    // Reservierungen der ausgewählten Maschine laden
    async function fetchMachineBookings(machineId) {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(
                `http://localhost:5000/api/bookings/machine/${machineId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setCalendarEvents(response.data);
        } catch (error) {
            console.error('Fehler beim Laden des Kalenders:', error);
        }
    }

    // Reservierung stornieren
    async function deleteBooking(id) {
        const confirmDelete = window.confirm(
            'Reservierung wirklich stornieren?'
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            await axios.delete(
                `http://localhost:5000/api/bookings/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage('Reservierung erfolgreich storniert');

            await fetchMyBookings();

            if (selectedMachine) {
                await fetchMachineBookings(selectedMachine);
            }

            setTimeout(() => {
                setMessage('');
            }, 3000);
        } catch (error) {
            console.error(error);

            setMessage(
                error.response?.data?.message ||
                'Stornierung fehlgeschlagen'
            );
        }
    }

    // Eigene Reservierungen laden
    async function fetchMyBookings() {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(
                'http://localhost:5000/api/bookings/my-bookings',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMyBookings(response.data);
        } catch (error) {
            console.error('Fehler beim Laden der Buchungen:', error);
        }
    }

    // Neue Reservierung erstellen
    async function handleBooking(e) {
        e.preventDefault();

        setBookingError(null);
        setMessage('');

        if (
            !selectedMachine ||
            !projectName.trim() ||
            !company.trim() ||
            !bemerkung.trim() ||
            !date ||
            !startTime ||
            !durationHours
        ) {
            setMessage('Bitte alle Pflichtfelder ausfüllen');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const startDateTime = new Date(
                `${date}T${startTime}:00`
            );

            const endDateTime = new Date(
                startDateTime.getTime() +
                Number(durationHours) * 60 * 60 * 1000
            );

            function formatLocalDateTime(dateObj) {
                const year = dateObj.getFullYear();

                const month = String(
                    dateObj.getMonth() + 1
                ).padStart(2, '0');

                const day = String(
                    dateObj.getDate()
                ).padStart(2, '0');

                const hours = String(
                    dateObj.getHours()
                ).padStart(2, '0');

                const minutes = String(
                    dateObj.getMinutes()
                ).padStart(2, '0');

                return `${year}-${month}-${day}T${hours}:${minutes}:00`;
            }

            await axios.post(
                'http://localhost:5000/api/bookings',
                {
                    machine_id: selectedMachine,
                    project_name: projectName,
                    company: company,
                    bemerkung: bemerkung,
                    start_time: formatLocalDateTime(startDateTime),
                    end_time: formatLocalDateTime(endDateTime)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage('Reservierung erfolgreich erstellt');

            setProjectName('');
            setCompany('');
            setBemerkung('');
            setDate('');
            setStartTime('');
            setDurationHours('');

            await fetchMachineBookings(selectedMachine);
            await fetchMyBookings();

            setTimeout(() => {
                setMessage('');
            }, 3000);
        } catch (error) {
            console.error(error);

            if (error.response?.status === 409) {
                setBookingError({
                    message:
                        error.response?.data?.message ||
                        'Zeitraum schon reserviert',

                    projectLeader:
                        error.response?.data?.project_leader_name,

                    projectName:
                        error.response?.data?.project_name
                });

                return;
            }

            setMessage(
                error.response?.data?.message ||
                'Reservierung fehlgeschlagen'
            );
        }
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-content">
                <h1 className="mb-4">
                    Buchung Dashboard
                </h1>

                {message && (
                    <div className="alert alert-info">
                        {message}
                    </div>
                )}

                {bookingError && (
                    <div className="alert alert-danger">
                        <strong>
                            {bookingError.message}
                        </strong>

                        {bookingError.projectLeader && (
                            <div className="mt-2">
                                Reserviert von Projektleiter:{' '}
                                <strong>
                                    {bookingError.projectLeader}
                                </strong>
                            </div>
                        )}

                        {bookingError.projectName && (
                            <div>
                                Projektnr.:{' '}
                                <strong>
                                    {bookingError.projectName}
                                </strong>
                            </div>
                        )}
                    </div>
                )}

                {/* Neue Reservierung */}
                <div className="card shadow p-4 mb-4">
                    <h4 className="mb-3">
                        Neue Reservierung
                    </h4>

                    <form onSubmit={handleBooking}>
                        {/* Maschine */}
                        <div className="mb-3">
                            <label className="form-label">
                                Maschine
                            </label>

                            <select
                                className="form-select"
                                value={selectedMachine}
                                onChange={(e) =>
                                    setSelectedMachine(e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    Maschine auswählen
                                </option>

                                {machines.map((machine) => (
                                    <option
                                        key={machine.id}
                                        value={machine.id}
                                    >
                                        {machine.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Projektinformationen */}
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">
                                    Projektnr.
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={projectName}
                                    onChange={(e) =>
                                        setProjectName(e.target.value)
                                    }
                                    placeholder="z. B. 11111"
                                    required
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label className="form-label">
                                    Kundenname
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={company}
                                    onChange={(e) =>
                                        setCompany(e.target.value)
                                    }
                                    placeholder="Kundenname"
                                    required
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label className="form-label">
                                    Bemerkung
                                </label>

                                <textarea
                                    className="form-control"
                                    value={bemerkung}
                                    onChange={(e) =>
                                        setBemerkung(e.target.value)
                                    }
                                    placeholder="Bemerkung eingeben ..."
                                    rows="3"
                                    required
                                />
                            </div>
                        </div>

                        {/* Zeitinformationen */}
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">
                                    Datum
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    value={date}
                                    onChange={(e) =>
                                        setDate(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label className="form-label">
                                    Startzeit
                                </label>

                                <input
                                    type="time"
                                    className="form-control"
                                    value={startTime}
                                    onChange={(e) =>
                                        setStartTime(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label className="form-label">
                                    Dauer in Stunden
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    value={durationHours}
                                    onChange={(e) =>
                                        setDurationHours(e.target.value)
                                    }
                                    min="1"
                                    step="0.5"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success"
                        >
                            Reservierung bestätigen
                        </button>
                    </form>
                </div>

                {/* Kalender */}
                <div className="card shadow p-4 mb-4">
                    <h4 className="mb-3">
                        Kalender der Maschine
                    </h4>

                    {!selectedMachine && (
                        <div className="alert alert-warning">
                            Bitte zuerst eine Maschine auswählen.
                        </div>
                    )}

                    {selectedMachine && (
                        <FullCalendar
                            plugins={[
                                dayGridPlugin,
                                timeGridPlugin,
                                interactionPlugin
                            ]}
                            initialView="timeGridWeek"
                            height="600px"
                            events={calendarEvents}
                            slotLabelFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }}
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }}
                        />
                    )}
                </div>

                {/* Meine Buchungen */}
                <div className="card shadow p-4">
                    <h4 className="mb-3">
                        Meine Buchungen
                    </h4>

                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Projektnr.</th>
                                    <th>Firma</th>
                                    <th>Bemerkung</th>
                                    <th>Maschine</th>
                                    <th>Start</th>
                                    <th>Ende</th>
                                    <th>Status</th>
                                    <th>Aktion</th>
                                </tr>
                            </thead>

                            <tbody>
                                {myBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>
                                            {booking.project_name}
                                        </td>

                                        <td>
                                            {booking.company || '-'}
                                        </td>

                                        <td>
                                            {booking.bemerkung || '-'}
                                        </td>

                                        <td>
                                            {booking.machine_name}
                                        </td>

                                        <td>
                                            {new Date(
                                                booking.start_time
                                            ).toLocaleString()}
                                        </td>

                                        <td>
                                            {new Date(
                                                booking.end_time
                                            ).toLocaleString()}
                                        </td>

                                        <td>
                                            {booking.status}
                                        </td>

                                        <td>
                                            {booking.status ===
                                                'planned' && (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() =>
                                                        deleteBooking(
                                                            booking.id
                                                        )
                                                    }
                                                >
                                                    Stornieren
                                                </button>
                                            )}

                                            {booking.status ===
                                                'cancelled' && (
                                                <span className="badge bg-danger">
                                                    Storniert
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Bookings;
