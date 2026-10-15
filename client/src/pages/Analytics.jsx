// Analytics Dashboard
// Zeigt Statistiken und Diagramme:
// - Buchungen pro Maschine
// - Testzeit pro Maschine
// - Buchungen pro Monat
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

import Sidebar from '../components/Sidebar';
// Lädt alle Analysedaten vom Backend
function Analytics() {

    const [charts, setCharts] =
        useState({
            bookingsPerMachine: [],
            testTimePerMachine: [],
            bookingsPerMonth: []
        });

    useEffect(() => {
        fetchCharts();
    }, []);
// Lädt alle Analysedaten vom Backend
    async function fetchCharts() {

        try {

            const token =
                localStorage.getItem('token');

            const response =
                await axios.get(
                    'http://localhost:5000/api/analytics/charts',
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );
                console.log(response.data);
                setCharts(response.data);
            console.log(response.data);

            setCharts(response.data);

        } catch (error) {

            console.error(error);
        }
    }

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <main className="dashboard-content">

                <h1 className="mb-5">
                    Analytics Dashboard
                </h1>

                <div className="card p-4 shadow mb-5">

                    <h3>
                        Buchungen pro Maschine
                    </h3>

                    <ResponsiveContainer
                        width="100%"
                        height={300}
                    >

                        <BarChart
                            data={
                                charts.bookingsPerMachine
                            }
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                            />

                            <XAxis
                                dataKey="machine_name"
                            />

                            <YAxis />

                            <Tooltip />

                            <Bar
                                dataKey="bookings_count"
                            />

                        </BarChart>

                    </ResponsiveContainer>

                </div>

                <div className="card p-4 shadow mb-5">

                    <h3>
                        Testzeit pro Maschine
                    </h3>

                    <ResponsiveContainer
                        width="100%"
                        height={300}
                    >

                        <BarChart
                            data={
                                charts.testTimePerMachine
                            }
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                            />

                            <XAxis
                                dataKey="machine_name"
                            />

                            <YAxis />

                            <Tooltip />

                            <Bar
                                dataKey="total_seconds"
                            />

                        </BarChart>

                    </ResponsiveContainer>

                </div>

                <div className="card p-4 shadow">

                    <h3>
                        Buchungen pro Monat
                    </h3>

                    <ResponsiveContainer
                        width="100%"
                        height={300}
                    >

                        <LineChart
                            data={
                                charts.bookingsPerMonth
                            }
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                            />

                            <XAxis
                                dataKey="month"
                            />

                            <YAxis />

                            <Tooltip />

                            <Line
                                type="monotone"
                                dataKey="bookings_count"
                            />

                        </LineChart>

                    </ResponsiveContainer>

                </div>

            </main>

        </div>
    );
}

export default Analytics;
