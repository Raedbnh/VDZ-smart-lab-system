import { useEffect, useState } from 'react';
import axios from 'axios';

import Sidebar from '../components/Sidebar';

function Users() {
    const [users, setUsers] = useState([]);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('mitarbeiter');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(
                'http://localhost:5000/api/auth/users',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUsers(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');

            await axios.post(
                'http://localhost:5000/api/auth/users',
                {
                    name,
                    email,
                    password,
                    role
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setName('');
            setEmail('');
            setPassword('');
            setRole('mitarbeiter');

            fetchUsers();

            alert('Benutzer erstellt');
        } catch (error) {
            alert(
                error.response?.data?.message ||
                'Benutzer konnte nicht erstellt werden'
            );
        }
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-content">
                <h1 className="mb-4">
                    Benutzerverwaltung
                </h1>

                <div className="card shadow p-4 mb-4">
                    <h4 className="mb-3">
                        Neuer Benutzer
                    </h4>

                    <form onSubmit={handleSubmit}>
                        <div className="row">

                            <div className="col-md-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="col-md-3">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="col-md-2">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Passwort"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="col-md-2">
                                <select
                                    className="form-select"
                                    value={role}
                                    onChange={(e) =>
                                        setRole(e.target.value)
                                    }
                                >
                                    <option value="mitarbeiter">
                                        Mitarbeiter
                                    </option>

                                    <option value="projektleiter">
                                        Projektleiter
                                    </option>

                                    <option value="admin">
                                        Admin
                                    </option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                >
                                    Erstellen
                                </button>
                            </div>

                        </div>
                    </form>
                </div>

                <div className="card shadow p-4">

                    <table className="table">

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Rolle</th>
                            </tr>

                        </thead>

                        <tbody>

                            {users.map((user) => (

                                <tr key={user.id}>

                                    <td>{user.id}</td>

                                    <td>{user.name}</td>

                                    <td>{user.email}</td>

                                    <td>{user.role}</td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </main>

        </div>
    );
}

export default Users;