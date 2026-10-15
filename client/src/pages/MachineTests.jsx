import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/Sidebar';

function MachineTests() {
    const { id } = useParams();

    const [machine, setMachine] = useState(null);
    const [tests, setTests] = useState([]);

    const [period, setPeriod] = useState('today');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    useEffect(() => {
        fetchMachine();
    }, [id]);

    useEffect(() => {
        fetchTests();
    }, [id, period, customFrom, customTo]);

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    function getDateRange() {
        const today = new Date();

        let from = new Date(today);
        let to = new Date(today);

        if (period === 'today') {
            return {
                from: formatDate(today),
                to: formatDate(today)
            };
        }

        if (period === 'yesterday') {
            from.setDate(today.getDate() - 1);

            return {
                from: formatDate(from),
                to: formatDate(from)
            };
        }

        if (period === 'last7') {
            from.setDate(today.getDate() - 6);

            return {
                from: formatDate(from),
                to: formatDate(today)
            };
        }

        if (period === 'last30') {
            from.setDate(today.getDate() - 29);

            return {
                from: formatDate(from),
                to: formatDate(today)
            };
        }

        if (period === 'month') {
            from = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

            return {
                from: formatDate(from),
                to: formatDate(today)
            };
        }

        return {
            from: customFrom,
            to: customTo
        };
    }

    async function fetchMachine() {
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

            const foundMachine = response.data.find(
                (item) => Number(item.id) === Number(id)
            );

            setMachine(foundMachine);

        } catch (error) {
            console.error(error);
        }
    }

    async function fetchTests() {
        const { from, to } = getDateRange();

        if (
            period === 'custom' &&
            (!from || !to)
        ) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(
                `http://localhost:5000/api/machines/${id}/tests`,
                {
                    params: {
                        from,
                        to
                    },

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setTests(response.data);

        } catch (error) {
            console.error(error);
        }
    }

    function getStatusClass(status) {
        if (status === 'completed') {
            return 'badge bg-success';
        }

        if (status === 'running') {
            return 'badge bg-primary';
        }

        if (status === 'cancelled') {
            return 'badge bg-danger';
        }

        return 'badge bg-warning text-dark';
    }

    function formatDateTime(value) {
        if (!value) {
            return '-';
        }

        return new Date(value).toLocaleString(
            'de-DE',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-content">

                <h1>
                    {machine?.name || 'Maschine'}
                </h1>

                {machine && (
                    <p>
                        Standort: {machine.location}
                    </p>
                )}

                <div className="card shadow-sm p-3 mb-4">

                    <div className="row align-items-end">

                        <div className="col-md-4">

                            <label className="form-label">
                                Zeitraum
                            </label>

                            <select
                                className="form-select"
                                value={period}
                                onChange={(e) =>
                                    setPeriod(e.target.value)
                                }
                            >
                                <option value="today">
                                    Heute
                                </option>

                                <option value="yesterday">
                                    Gestern
                                </option>

                                <option value="last7">
                                    Letzte 7 Tage
                                </option>

                                <option value="last30">
                                    Letzte 30 Tage
                                </option>

                                <option value="month">
                                    Dieser Monat
                                </option>

                                <option value="custom">
                                    Benutzerdefiniert
                                </option>
                            </select>

                        </div>

                        {period === 'custom' && (
                            <>
                                <div className="col-md-3">

                                    <label className="form-label">
                                        Von
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={customFrom}
                                        onChange={(e) =>
                                            setCustomFrom(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div className="col-md-3">

                                    <label className="form-label">
                                        Bis
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={customTo}
                                        onChange={(e) =>
                                            setCustomTo(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>
                            </>
                        )}

                    </div>

                </div>

                <div className="card shadow">

                    <div className="card-body">

                        <h4 className="mb-4">
                            Tests
                        </h4>

                        {tests.length === 0 ? (

                            <p className="text-muted">
                                Keine Tests im ausgewählten Zeitraum.
                            </p>

                        ) : (

                            <div className="table-responsive">

                                <table className="table table-hover align-middle">

                                    <thead>
                                        <tr>
                                            <th>Projektnr.</th>
                                            <th>Firma</th>
                                            <th>Projektleiter</th>
                                            <th>Prüflevel</th>
                                            <th>Start</th>
                                            <th>Ende</th>
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
                                                    {test.company || '-'}
                                                </td>

                                                <td>
                                                    {test.project_leader_name || '-'}
                                                </td>

                                                <td>
                                                    {test.test_level || '-'}
                                                </td>

                                                <td>
                                                    {formatDateTime(test.start_time)}
                                                </td>

                                                <td>
                                                    {formatDateTime(test.end_time)}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            getStatusClass(test.status)
                                                        }
                                                    >
                                                        {test.status}
                                                    </span>
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                </div>

            </main>
        </div>
    );
}

export default MachineTests;