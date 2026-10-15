import { Link } from 'react-router-dom';
// Aktuell angemeldeter Benutzer
// Wird aus dem LocalStorage geladen

function Sidebar() {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <div className="sidebar">
            <h4 className="text-info mb-4">

                VDZ Smart Lab
            </h4>
            {/* --------------------------------------
                Dashboard
                Für alle Benutzer verfügbar
            -------------------------------------- */}
            <Link to="/dashboard">
                Übersicht
            </Link>
            {/* --------------------------------------
                Admin-Menü
                Nur für Administratoren sichtbar
            -------------------------------------- */}
            {user?.role === 'admin' && (
                <>
                    <Link to="/machines">Maschinen</Link>
                    <Link to="/analytics">Analyse</Link>
                    <Link to="/completed-tests">Abgeschlossene Tests</Link>
                    <Link to="/users">Benutzerverwaltung</Link>
                </>
            )}

            {user?.role === 'projektleiter' && (
                <>
                    <Link to="/machines">Maschinen</Link>
                    <Link to="/bookings">Buchungen</Link>
                    <Link to="/analytics">Analyse</Link>
                </>
            )}

            {user?.role === 'mitarbeiter' && (
                <>
                    <span className="text-white">
                        Bitte QR-Code einer Maschine scannen
                    </span>
                </>
            )}
            {/* --------------------------------------
                Logout
                Entfernt Token und Benutzerdaten
                aus dem LocalStorage
            -------------------------------------- */}
            <button
                className="btn btn-danger w-100 mt-4"
                onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }}
            >
                Abmelden
            </button>
        </div>
    );
}

export default Sidebar;