'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Patient } from '@/lib/types';

Chart.register(...registerables);

interface PatientCardProps {
  patient: Patient;
  onDelete: (id: number) => void;
}

function calculateECGBaseline(x: number): number {
  return (
    -0.06366 +
    0.12613 * Math.cos((Math.PI * x) / 500) +
    0.12258 * Math.cos((Math.PI * x) / 250) +
    0.01593 * Math.sin((Math.PI * x) / 500) +
    0.03147 * Math.sin((Math.PI * x) / 250)
  );
}

const getAlertTextColor = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('irregularidade')) return 'text-red-600';
  if (lower.includes('normalizado')) return 'text-green-600';
  return 'text-gray-800';
};

const PatientCard: React.FC<PatientCardProps> = ({ patient, onDelete }) => {
  const [ecgData, setEcgData] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const xRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    const interval = setInterval(() => {
      xRef.current += 50;
      const y = calculateECGBaseline(xRef.current);
      const simulatedY = Math.random() < 0.1 ? y * 1.3 : y;
      socket.emit('ecgData', { x: xRef.current, y: simulatedY });
    }, 50);

    socket.on('ecgData', (data: { ecgValue: number }) => {
      setEcgData((prev) => [...prev.slice(-100), data.ecgValue]);
    });

    socket.on('alert', (alert: { message: string }) => {
      setAlerts((prev) => [...prev.slice(-5), alert.message]);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const chartData = {
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  return (
    <div className="border border-gray-200 p-4 rounded shadow bg-white text-black h-96 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-semibold">{patient.name}</h3>
        <button
          onClick={() => setIsConfirmOpen(true)}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 transition"
        >
          Excluir
        </button>
      </div>
      <div className="mb-4 h-48">
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className="bg-gray-50 p-2 rounded h-32 overflow-y-auto">
        {alerts.map((alert, i) => (
          <div key={i} className={`mb-1 font-bold ${getAlertTextColor(alert)}`}>
            {alert}
          </div>
        ))}
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-11/12 max-w-md">
            <h4 className="text-lg font-bold mb-4">Confirmação</h4>
            <p className="mb-4">Tem certeza de que deseja excluir este paciente?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  onDelete(patient.id);
                  setIsConfirmOpen(false);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition"
              >
                Sim, excluir
              </button>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCard;
