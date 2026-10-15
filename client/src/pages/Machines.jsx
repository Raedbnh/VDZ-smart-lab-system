import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/Sidebar';

function Machines() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));

    const [machines, setMachines] = useState([]);
    const [selectedQr, setSelectedQr] = useState(null);
    const [selectedMachine, setSelectedMachine] = useState('');

    useEffect(() => {
        fetchMachines();
    }, []);

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
            console.error(error);
        }
    }

    async function showQrCode(machine) {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(
                `http://localhost:5000/api/machines/${machine.id}/qrcode`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSelectedQr(response.data.qrCode);
            setSelectedMachine(machine.name);

        } catch (error) {
            console.error(error);
        }
    }

    async function deleteMachine(machineId) {
        if (!window.confirm('Maschine wirklich löschen?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');

            await axios.delete(
                `http://localhost:5000/api/machines/${machineId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            fetchMachines();

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                'Maschine konnte nicht gelöscht werden'
            );
        }
    }

    return (
        <div className="dashboard-layout">

            <Sidebar />

            <main className="dashboard-content">

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <h1>Maschinen</h1>

                    {user?.role === 'admin' && (

                        <button
                            className="btn btn-primary"
                            onClick={() =>
                                navigate('/machines/add')
                            }
                        >
                            + Maschine hinzufügen
                        </button>

                    )}

                </div>

                <div className="row">

                    {machines.map((machine) => (

                        <div
                            className="col-md-4 mb-4"
                            key={machine.id}
                        >

                            <div
                                className="card shadow p-4 h-100"
                                style={{
                                    cursor: 'pointer'
                                }}
                                onClick={() =>
                                    navigate(
                                        `/machines/${machine.id}/tests`
                                    )
                                }
                            >

                                <h3>
                                    {machine.name}
                                </h3>

                                <p>
                                    Standort: {machine.location}
                                </p>

                                <p>
                                    Status:{' '}

                                    <span
                                        className={
                                            machine.status === 'available'
                                                ? 'badge bg-success'
                                                : machine.status === 'maintenance'
                                                    ? 'badge bg-danger'
                                                    : 'badge bg-warning text-dark'
                                        }
                                    >
                                        {machine.status}
                                    </span>
                                </p>

                                <p className="text-muted mt-2">
                                    Maschine anklicken, um alle Tests anzuzeigen.
                                </p>

                                {user?.role === 'admin' && (

                                    <div className="d-flex flex-wrap gap-2 mt-3">

                                        <button
                                            className="btn btn-info"
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                showQrCode(machine);
                                            }}
                                        >
                                            QR-Code
                                        </button>

                                        <button
                                            className="btn btn-warning"
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                navigate(
                                                    `/machines/edit/${machine.id}`
                                                );
                                            }}
                                        >
                                            Bearbeiten
                                        </button>

                                        <button
                                            className="btn btn-danger"
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                deleteMachine(
                                                    machine.id
                                                );
                                            }}
                                        >
                                            Löschen
                                        </button>

                                    </div>

                                )}

                            </div>

                        </div>

                    ))}

                </div>

                {selectedQr && (

                    <div className="qr-modal">

                        <div className="qr-box">

                            <h3>
                                {selectedMachine}
                            </h3>

                            <img
                                src={selectedQr}
                                alt="QR-Code"
                                className="img-fluid mb-3"
                            />

                            <p>
                                QR-Code führt zur heutigen Aufgabenliste dieser Maschine.
                            </p>

                            <button
                                className="btn btn-danger"
                                onClick={() =>
                                    setSelectedQr(null)
                                }
                            >
                                Schließen
                            </button>

                        </div>

                    </div>

                )}

            </main>

        </div>
    );
}

export default Machines;