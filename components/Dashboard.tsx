'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { Patient, AlertLog } from '@/lib/types';

Chart.register(...registerables);

function calculateECGBaseline(x: number): number {
  return (
    -0.06366 +
    0.12613 * Math.cos((Math.PI * x) / 500) +
    0.12258 * Math.cos((Math.PI * x) / 250) +
    0.01593 * Math.sin((Math.PI * x) / 500) +
    0.03147 * Math.sin((Math.PI * x) / 250)
  );
}

const Dashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [ecgData, setEcgData] = useState<number[]>([]);
  const [historicalData, setHistoricalData] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [stats, setStats] = useState({ average: 0, variance: 0 });
  const timeRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const selectedPatientRef = useRef<Patient | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patients');
        if (!response.ok) {
          throw new Error(`Erro ao buscar pacientes: ${response.status}`);
        }
        const data: Patient[] = await response.json();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatient(data[0]);
          selectedPatientRef.current = data[0];
        }
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    selectedPatientRef.current = selectedPatient;
    setEcgData([]);
    setHistoricalData([]);
    setAlerts([]);
    setStats({ average: 0, variance: 0 });
    timeRef.current = 0;
  }, [selectedPatient]);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    const interval = setInterval(() => {
      timeRef.current += 50;
      const baseline = calculateECGBaseline(timeRef.current);
      const simulatedY = Math.random() < 0.1 ? baseline * 1.3 : baseline;
      if (selectedPatientRef.current) {
        socket.emit('ecgData', { 
          x: timeRef.current, 
          y: simulatedY, 
          patientId: selectedPatientRef.current.id 
        });
      }
    }, 50);

    socket.on('ecgData', (data: { ecgValue: number; patientId?: number }) => {
      if (
        !data.hasOwnProperty('patientId') ||
        (selectedPatientRef.current && data.patientId === selectedPatientRef.current.id)
      ) {
        setEcgData((prev) => [...prev.slice(-100), data.ecgValue]);
        setHistoricalData((hist) => [...hist, data.ecgValue]);
      }
    });

    socket.on('alert', (alert: { type: string; message: string; startTime?: string; duration?: number; patientId?: number }) => {
      if (
        !alert.hasOwnProperty('patientId') ||
        (selectedPatientRef.current && alert.patientId === selectedPatientRef.current.id)
      ) {
        const log: AlertLog = {
          type: alert.type,
          message: alert.message,
          timestamp: alert.startTime || new Date().toISOString(),
          duration: alert.duration,
        };
        setAlerts((prev) => [...prev.slice(-10), log]);
      }
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (historicalData.length) {
      const avg = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
      const variance =
        historicalData.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / historicalData.length;
      setStats({ average: avg, variance });
    }
  }, [historicalData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
  };

  const realTimeChartData = {
    labels: ecgData.map((_, i) => i),
    datasets: [
      {
        label: 'ECG (mV)',
        data: ecgData,
        borderColor: '#4CAF50',
        tension: 0.1,
      },
    ],
  };

  const trendChartData = {
    labels: historicalData.map((_, i) => i),
    datasets: [
      {
        label: 'Tendência do ECG',
        data: historicalData,
        borderColor: '#3f51b5',
        tension: 0.2,
      },
    ],
  };

  const getAlertTextColor = (type: string) => {
    switch (type) {
      case 'bip':
        return 'text-red-600';
      case 'bipbip':
        return 'text-green-600';
      default:
        return 'text-black';
    }
  };

  return (
<div className="p-5 grid gap-5 text-black pb-20">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <div className="flex flex-col sm:flex-row items-center sm:justify-center mb-6 space-y-2 sm:space-y-0 sm:space-x-3">
        <label className="font-medium text-white">Selecione o paciente:</label>
        <select
          value={selectedPatient?.id}
          onChange={(e) => {
            const patient = patients.find((p) => p.id === Number(e.target.value));
            setSelectedPatient(patient || null);
          }}
          className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <section className="bg-gray-100 p-4 rounded shadow h-64">
        <h3 className="text-xl font-semibold mb-2">ECG em Tempo Real</h3>
        <div className="h-full">
          <Line data={realTimeChartData} options={chartOptions} />
        </div>
      </section>

      <section className="bg-gray-100 p-4 rounded shadow h-64">
        <h3 className="text-xl font-semibold mb-2">Gráfico de Tendência</h3>
        <div className="h-full">
          <Line data={trendChartData} options={chartOptions} />
        </div>
      </section>

      <section className="bg-gray-100 p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">Estatísticas Históricas</h3>
        <p>Média: {stats.average.toFixed(3)}</p>
        <p>Variância: {stats.variance.toFixed(3)}</p>
      </section>

      <section className="bg-gray-100 p-4 rounded shadow pb-10">
        <h3 className="text-xl font-semibold mb-2">Histórico de Alertas</h3>
        <AnimatePresence>
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className={`p-2 mb-2 rounded bg-gray-50 ${getAlertTextColor(alert.type)}`}
            >
              <strong>{alert.message}</strong> - {new Date(alert.timestamp).toLocaleTimeString()}
              {alert.duration && <span> ({alert.duration}s)</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Dashboard;
