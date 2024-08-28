import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';

const createDB = async (filename: string = './database.sqlite'): Promise<Database> => {
    const db = await open({
        filename,
        driver: sqlite3.Database,
    });

    await db.exec(`CREATE TABLE IF NOT EXISTS mappings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

    return db;
};

export const initDatabase = async () => {
    const db = await createDB();

    const setData = async (key: string, value: string): Promise<void> => {
        await db.run('INSERT OR REPLACE INTO mappings (key, value) VALUES (?, ?)', [key, value]);
    };

    const getData = async (key: string): Promise<string | undefined> => {
        const row = await db.get('SELECT value FROM mappings WHERE key = ?', [key]);
        return row?.value;
    };

    const getAllData = async (): Promise<Array<{ key: string; value: string }>> => {
        return db.all('SELECT key, value FROM mappings');
    };

    return {
        setData,
        getData,
        getAllData,
    };
};
