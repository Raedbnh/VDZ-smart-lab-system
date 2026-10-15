// Heutige Aufgaben einer Maschine
//
// Wird über den QR-Code geöffnet.
//
// Mitarbeiter können:
// - Test starten
// - Test beenden

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/Sidebar';

function TodayTasks() {
    const { id } = useParams();

    const [tasks, setTasks] = useState([]);
    const [runningTaskId, setRunningTaskId] = useState(null);
    const [seconds, setSeconds] = useState(0);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchTodayTasks();
    }, []);

    useEffect(() => {
        let interval = null;

        if (runningTaskId) {
            interval = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [runningTaskId]);
// Startet einen Test
// Status:
// planned -> running
    async function fetchTodayTasks() {
        try {
            setMessage('');

            const token = localStorage.getItem('token');

            const response = await axios.get(
                `http://192.168.32.43:5000/api/machines/${id}/today-tasks`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log('Maschinen-ID:', id);
            console.log('Heutige Tests:', response.data);

            setTasks(response.data);

        } catch (error) {
            console.error('Fehler beim Laden:', error);

            setMessage(
                error.response?.data?.message ||
                `Fehler beim Laden der Tests (${error.response?.status || 'Netzwerkfehler'})`
            );
        }
    }

    async function handleStart(taskId) {
        try {
            const token = localStorage.getItem('token');

            await axios.post(
                `http://192.168.32.43:5000/api/bookings/${taskId}/start`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRunningTaskId(taskId);
            setSeconds(0);
            setMessage('Test gestartet');

            setTimeout(() => {
                setMessage('');
            }, 3000);

            fetchTodayTasks();
        } catch (error) {
            setMessage('Test konnte nicht gestartet werden');
        }
    }
// Beendet einen Test
// Status:
// running -> completed
// Die tatsächliche Dauer wird gespeichert.
    async function handleStop(taskId) {
        try {
            const token = localStorage.getItem('token');

            await axios.post(
                `http://localhost:5000/api/bookings/${taskId}/stop`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRunningTaskId(null);
            setSeconds(0);
            setMessage('Test erfolgreich abgeschlossen');

            setTimeout(() => {
                setMessage('');
            }, 3000);

            fetchTodayTasks();
        } catch (error) {
            setMessage('Test konnte nicht gestoppt werden');
        }
    }

    function formatTime(totalSeconds) {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        return `${hrs}h ${mins}m ${secs}s`;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-content">
                <h1 className="mb-4">
                    Heutige Tests
                </h1>

                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}

                {tasks.length === 0 && (
                    <div className="alert alert-info">
                        Keine Tests für diese Maschine gefunden.
                    </div>
                )}

                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="card shadow p-4 mb-4"
                    >
                        
                    <h3>{task.project_name}</h3>

                    <p>
                        <strong>Kunde:</strong> {task.company || '-'}
                    </p>

                    <p>
                        <strong>Bemerkung:</strong> {task.bemerkung || '-'}
                    </p>

                    <p>
                        <strong>Mitarbeiter:</strong> {task.user_name || '-'}
                    </p>

                    <p>
                        <strong>Start:</strong>{' '}
                        {new Date(task.start_time).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>

                    <p>
                        <strong>Ende:</strong>{' '}
                        {new Date(task.end_time).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>

                    <p>
                        <strong>Status:</strong> {task.status}
                    </p>


                        {runningTaskId === task.id && (
                            <h4 className="text-success">
                                {formatTime(seconds)}
                            </h4>
                        )}

                        <div className="d-flex gap-2 mt-3">
                            <button
                                className="btn btn-success"
                                disabled={task.status === 'completed'}
                                onClick={() => handleStart(task.id)}
                            >
                                Test starten
                            </button>

                            <button
                                className="btn btn-danger"
                                disabled={task.status === 'completed'}
                                onClick={() => handleStop(task.id)}
                            >
                                Test stoppen
                            </button>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}

export default TodayTasks;