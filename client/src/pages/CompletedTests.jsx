// Übersicht aller abgeschlossenen Tests
// Zeigt:
// - Maschine
// - Benutzer
// - Startzeit
// - Endzeit
// - Testdauer
import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

function CompletedTests() {

    const [tests, setTests] =
        useState([]);

    useEffect(() => {

        fetchCompletedTests();

    }, []);
// Lädt alle abgeschlossenen Tests
    async function fetchCompletedTests() {

        try {

            const token =
                localStorage.getItem('token');

            const response =
                await axios.get(
                    'http://localhost:5000/api/bookings/completed',
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setTests(response.data);

        } catch (error) {

            console.error(error);
        }
    }

    function formatDuration(seconds) {

        const hrs =
            Math.floor(seconds / 3600);

        const mins =
            Math.floor(
                (seconds % 3600) / 60
            );

        return `${hrs}h ${mins}m`;
    }

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <main className="dashboard-content">

                <h1 className="mb-4">

                    Abgeschlossene Tests

                </h1>

                <table className="table table-striped">

                    <thead>

                        <tr>

                            <th>Projekt</th>

                            <th>Maschine</th>

                            <th>Mitarbeiter</th>

                            <th>Dauer</th>

                            <th>Status</th>

                        </tr>

                    </thead>

                    <tbody>

                        {tests.map((test) => (

                            <tr key={test.id}>

                                <td>
                                    {test.project_name}
                                </td>

                                <td>
                                    {test.machine_name}
                                </td>

                                <td>
                                    {test.user_name}
                                </td>

                                <td>
                                    {formatDuration(
                                        test.duration_seconds
                                    )}
                                </td>

                                <td>

                                    <span
                                        className="
                                        badge
                                        bg-success"
                                    >
                                        {test.status}
                                    </span>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </main>

        </div>
    );
}

export default CompletedTests;