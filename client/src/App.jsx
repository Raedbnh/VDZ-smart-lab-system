import { Routes, Route, Navigate } from 'react-router-dom';
import Users from './pages/Users';
import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import Bookings from './pages/Bookings';
import TodayTasks from './pages/TodayTasks';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import MachineDetails from './pages/MachineDetails';
import CompletedTests from './pages/CompletedTests';
import AddMachine from './pages/AddMachine';
import EditMachine from './pages/EditMachine';
import MachineTests from './pages/MachineTests';
//ProtectedRoute prüft:→ Token vorhanden?→ Benutzer eingeloggt?Falls nein:→ Weiterleitung zur Login-SeiteFalls ja:→ Zugriff auf die gewünschte Seite
function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function Home() {
    return (
        <div className="vh-100 d-flex justify-content-center align-items-center bg-dark text-white">
            <h1 className="animated-title">
                VDZ Smart-Lab-Management-System
            </h1>
        </div>
    );
}
// Verwaltet:
// - Navigation
// - Routing
// - Zugriffsschutz
function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/machines"
                element={
                    <ProtectedRoute>
                        <Machines />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/machines/:id"
                element={
                    <ProtectedRoute>
                        <MachineDetails />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/machines/:id/today-tasks"
                element={
                    <ProtectedRoute>
                        <TodayTasks />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/bookings"
                element={
                    <ProtectedRoute>
                        <Bookings />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/analytics"
                element={
                    <ProtectedRoute>
                        <Analytics />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/completed-tests"
                element={
                    <ProtectedRoute>
                        <CompletedTests />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/machines/add"
                element={
                    <ProtectedRoute>
                        <AddMachine />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/users"
                element={<ProtectedRoute><Users /></ProtectedRoute>}
            />

            <Route
                path="/machines/edit/:id"
                element={
                    <ProtectedRoute>
                        <EditMachine />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
            <Route
                path="/machines/:id/tests"
                element={<MachineTests />}
            />
        </Routes>
    );
}

export default App;
//zentrale Routing-Komponente
