// Detailansicht einer Maschine
// Zeigt:
// - Maschineninformationen
// - Reservierungen
// - Freie Zeiten
import { useParams } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import FullCalendar from '@fullcalendar/react';

import dayGridPlugin
    from '@fullcalendar/daygrid';

import timeGridPlugin
    from '@fullcalendar/timegrid';

import interactionPlugin
    from '@fullcalendar/interaction';

import { useEffect, useState } from 'react';

import axios from 'axios';

function MachineDetails() {

    const { id } = useParams();
    const [bookings, setBookings] = useState([]);
    const [projectName, setProjectName] =
        useState('');
    const [date, setDate] =
        useState('');

    const [startTime, setStartTime] =
        useState('');

    const [endTime, setEndTime] =
        useState('');

    const [description, setDescription] =
        useState('');

    useEffect(() => {

        fetchBookings();

    }, []);

    async function fetchBookings() {

        try {

            const token =
                localStorage.getItem('token');

            const response = await axios.get(
                `http://localhost:5000/api/bookings/machine/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setBookings(response.data);

        } catch (error) {

            console.error(error);
        }
    }
    async function handleBooking(e) {

        e.preventDefault();

        try {

            const token =
                localStorage.getItem('token');

            await axios.post(
                'http://localhost:5000/api/bookings',
                {
                    machine_id: id,

                    project_name:
                        projectName,

                    start_time:
                        `${date}T${startTime}:00`,

                    end_time:
                        `${date}T${endTime}:00`,

                    description
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            alert(
                'Reservierung erfolgreich erstellt'
            );

            fetchBookings();

        } catch (error) {

            alert(
                error.response?.data?.message
                ||
                'Reservierung fehlgeschlagen'
            );
        }
    }


    return (

        <div className="dashboard-layout">

            <Sidebar />

            <main className="dashboard-content">

                <h1 className="mb-4">
                    Maschinen Details
                </h1>

                <div className="card shadow p-4 mb-4">

                    <h3>
                        Maschine #{id}
                    </h3>

                    <p>
                        Hier wird später:
                    </p>

                    <ul>

                        <li>Maschineninformationen</li>

                        <li>Kalender</li>

                        <li>Freie Zeiten</li>

                        <li>Reservierungen</li>

                        <li>QR-Code</li>

                    </ul>

                </div>

                <div className="card shadow p-4 mb-4">

                    <h4 className="mb-4">
                        Maschinen Kalender
                    </h4>

                    <FullCalendar
                        plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            interactionPlugin
                        ]}
                        initialView="dayGridMonth"
                        height="500px"
                        events={bookings}
                    />

                </div>
                <div className="card shadow p-4">

                    <h4 className="mb-3">
                        Neue Reservierung
                    </h4>

                    <form onSubmit={handleBooking}>

                        <div className="row">

                            <div className="col-md-4 mb-3">

                                <label className="form-label">
                            <div className="col-md-12 mb-3">

                                <label className="form-label">
                                    Projektname
                                </label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={projectName}
                                    onChange={(e) =>
                                        setProjectName(e.target.value)
                                    }
                                />

                            </div>

                                    Datum
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
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
                                    onChange={(e) => setStartTime(e.target.value)}
                                />

                            </div>

                            <div className="col-md-4 mb-3">

                                <label className="form-label">
                                    Endzeit
                                </label>

                                <input
                                    type="time"
                                    className="form-control"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />

                            </div>

                        </div>

                        <div className="mb-3">

                            <label className="form-label">
                                Beschreibung
                            </label>

                            <textarea
                                className="form-control"
                                rows="4"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                        </div>

                        <button className="btn btn-success">

                            Reservierung bestätigen

                        </button>

                    </form>

                </div>

            </main>

        </div>
    );
}

export default MachineDetails;