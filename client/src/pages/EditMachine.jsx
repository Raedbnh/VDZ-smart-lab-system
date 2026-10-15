import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/Sidebar';

function EditMachine() {
    const { id } = useParams();

    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [status, setStatus] = useState('available');

    useEffect(() => {
        fetchMachine();
    }, []);

    async function fetchMachine() {
        try {
            const token =
                localStorage.getItem('token');

            const response =
                await axios.get(
                    'http://localhost:5000/api/machines',
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const machine =
                response.data.find(
                    (m) =>
                        m.id === Number(id)
                );

            if (machine) {
                setName(machine.name);
                setLocation(machine.location);
                setStatus(machine.status);
            }

        } catch (error) {

            console.error(error);
        }
    }

    async function handleSubmit(e) {

        e.preventDefault();

        try {

            const token =
                localStorage.getItem('token');

            await axios.put(
                `http://localhost:5000/api/machines/${id}`,
                {
                    name,
                    location,
                    status
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            alert(
                'Maschine aktualisiert'
            );

            navigate('/machines');

        } catch (error) {

            console.error(error);

            alert(
                'Aktualisierung fehlgeschlagen'
            );
        }
    }

    return (
        <div className="dashboard-layout">

            <Sidebar />

            <main className="dashboard-content">

                <h1 className="mb-4">
                    Maschine bearbeiten
                </h1>

                <div className="card shadow p-4">

                    <form onSubmit={handleSubmit}>

                        <div className="mb-3">

                            <label className="form-label">
                                Maschinenname
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="mb-3">

                            <label className="form-label">
                                Standort
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                value={location}
                                onChange={(e) =>
                                    setLocation(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="mb-3">

                            <label className="form-label">
                                Status
                            </label>

                            <select
                                className="form-select"
                                value={status}
                                onChange={(e) =>
                                    setStatus(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="available">
                                    Available
                                </option>

                                <option value="reserved">
                                    Reserved
                                </option>

                                <option value="maintenance">
                                    Maintenance
                                </option>

                            </select>

                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Speichern
                        </button>

                    </form>

                </div>

            </main>

        </div>
    );
}

export default EditMachine;