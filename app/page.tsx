'use client';

import React, { useState, useEffect } from 'react';
import PatientModal from '@/components/PatientModal';
import PatientCard from '@/components/PatientCard';
import { Patient } from '@/lib/types';

const HomePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshPatients, setRefreshPatients] = useState(false);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) {
        throw new Error(`Erro ao buscar pacientes: ${response.status}`);
      }
      const data: Patient[] = await response.json();
      setPatients(data);
    } catch (error: unknown) {
      console.error('Erro ao buscar pacientes:', error);
      alert('Erro ao buscar pacientes. Verifique o console para mais detalhes.');
    }
  };

  useEffect(() => {
    fetchPatients();
    setRefreshPatients(false);
  }, [refreshPatients]);

  const handlePatientAdded = () => {
    setRefreshPatients(true);
  };

  const handlePatientDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/patients?id=${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Erro ao excluir paciente: ${response.status}`);
      }
      setPatients((prev) => prev.filter((patient) => patient.id !== id));
    } catch (error: unknown) {
      console.error('Erro ao excluir paciente:', error);
      alert('Erro ao excluir paciente. Verifique o console para mais detalhes.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-10">
      <header className="text-center py-6">
        <h1 className="text-3xl font-bold">Bem vindo Doutor!</h1>
      </header>
      <main className="flex flex-col items-center px-4 flex-1">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
        >
          Cadastrar Paciente
        </button>
        <PatientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPatientAdded={handlePatientAdded}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mt-6">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} onDelete={handlePatientDelete} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
