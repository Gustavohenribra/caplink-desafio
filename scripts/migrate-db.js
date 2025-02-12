import sqlite3Module from 'sqlite3';
const sqlite3 = sqlite3Module.verbose();
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, process.env.DB_PATH)
  : path.resolve(__dirname, '../database/database.sqlite');

const initSqlPath = process.env.INIT_SQL_PATH
  ? path.resolve(__dirname, process.env.INIT_SQL_PATH)
  : path.resolve(__dirname, '../database/init.sql');

function initializeDatabase() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error("Erro ao abrir o banco de dados:", err.message);
            return;
        }
        console.log('Conectado ao banco de dados SQLite.');

        const initSql = fs.readFileSync(initSqlPath, 'utf-8');

        db.exec(initSql, (err) => {
            if (err) {
                console.error("Erro ao executar script de inicialização:", err.message);
            } else {
                console.log('Banco de dados inicializado com sucesso.');
            }
            db.close();
        });
    });
}

initializeDatabase();
