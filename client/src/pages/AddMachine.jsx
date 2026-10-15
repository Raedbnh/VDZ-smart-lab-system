import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/Sidebar';

function AddMachine() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [status, setStatus] = useState('available');

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');

            await axios.post(
                'http://localhost:5000/api/machines',
                {
                    name,
                    location,
                    status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert('Maschine erfolgreich erstellt');

            navigate('/machines');
        } catch (error) {
            console.error(error);

            alert('Maschine konnte nicht erstellt werden');
        }
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-content">
                <h1 className="mb-4">
                    Neue Maschine
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
                                    setName(e.target.value)
                                }
                                required
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
                                    setLocation(e.target.value)
                                }
                                required
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
                                    setStatus(e.target.value)
                                }
                            >
                                <option value="available">
                                    Available
                                </option>

                                <option value="maintenance">
                                    Maintenance
                                </option>

                                <option value="reserved">
                                    Reserved
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

export default AddMachine;