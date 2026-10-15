import { Link } from 'react-router-dom';

function Navbar() {

    return (

        <nav className="navbar navbar-expand-lg navbar-dark bg-black shadow">

            <div className="container">

                <Link
                    className="navbar-brand fw-bold text-info"
                    to="/"
                >
                    VDZ Smart Lab
                </Link>

                <div className="d-flex gap-3">

                    <Link
                        className="btn btn-outline-info"
                        to="/login"
                    >
                        Login
                    </Link>

                    <Link
                        className="btn btn-info"
                        to="/dashboard"
                    >
                        Dashboard
                    </Link>

                </div>

            </div>

        </nav>
    );
}

export default Navbar;