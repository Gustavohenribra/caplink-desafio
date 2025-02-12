import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function openDb() {
  return open({
    filename: process.env.DB_PATH || 'database/database.sqlite',
    driver: sqlite3.Database,
  });
}

export async function POST(req: NextRequest) {
  const { name, age } = await req.json();

  if (!name || !age) {
    return NextResponse.json({ message: 'Nome e idade são obrigatórios.' }, { status: 400 });
  }

  try {
    const db = await openDb();
    const stmt = await db.prepare('INSERT INTO Patients (name, age) VALUES (?, ?)');
    await stmt.run(name, age);
    await stmt.finalize();
    await db.close();
    return NextResponse.json({ message: 'Paciente cadastrado com sucesso!' }, { status: 201 });
  } catch (error: unknown) {
    let errorMessage = 'Erro ao cadastrar paciente.';
    if (error instanceof Error) {
      console.error('Erro ao cadastrar paciente:', error.message);
      errorMessage += ` ${error.message}`;
    } else {
      console.error('Erro ao cadastrar paciente:', error);
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await openDb();
    const patients = await db.all('SELECT * FROM Patients');
    await db.close();
    return NextResponse.json(patients, { status: 200 });
  } catch (error: unknown) {
    let errorMessage = 'Erro ao listar pacientes.';
    if (error instanceof Error) {
      console.error('Erro ao listar pacientes:', error.message);
      errorMessage += ` ${error.message}`;
    } else {
      console.error('Erro ao listar pacientes:', error);
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ message: 'ID é obrigatório para excluir um paciente.' }, { status: 400 });
  }

  try {
    const db = await openDb();
    await db.run('DELETE FROM Patients WHERE id = ?', id);
    await db.close();
    return NextResponse.json({ message: 'Paciente excluído com sucesso!' }, { status: 200 });
  } catch (error: unknown) {
    let errorMessage = 'Erro ao excluir paciente.';
    if (error instanceof Error) {
      console.error('Erro ao excluir paciente:', error.message);
      errorMessage += ` ${error.message}`;
    } else {
      console.error('Erro ao excluir paciente:', error);
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
