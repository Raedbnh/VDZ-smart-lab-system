import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleLogin(e) {

        e.preventDefault();

        try {

            const response = await axios.post(
                `http://${window.location.hostname}:5000/api/auth/login`,
                {
                    email,
                    password
                }
            );

            localStorage.setItem(
                'token',
                response.data.token
            );

            localStorage.setItem(
                'user',
                JSON.stringify(response.data.user)
            );

            alert('Login erfolgreich');
            navigate('/dashboard');
            console.log(response.data);

        } catch (error) {

            console.error(error.response?.data || error.message);

            alert(error.response?.data?.message || 'Login fehlgeschlagen');
        }
    }

    return (

        <div className="vh-100 bg-dark d-flex justify-content-center align-items-center">

            <div
                className="card shadow p-5"
                style={{ width: '420px' }}
            >

                <h2 className="text-center mb-4">
                    Anmeldung
                </h2>

                <form onSubmit={handleLogin}>

                    <div className="mb-3">

                        <label className="form-label">
                            E-Mail
                        </label>

                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                    </div>

                    <div className="mb-4">

                        <label className="form-label">
                            Passwort
                        </label>

                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                    </div>

                    <button
                        className="btn btn-info w-100"
                    >
                        Einloggen
                    </button>

                </form>

            </div>

        </div>
    );
}

export default Login;