import pg from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';
dotenv.config();

const { Pool } = pg;

const connection = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

try {
    await connection.connect();
    console.log(chalk.blue('Connected to Postgres database'));
} catch {
    console.log(chalk.red('Error connecting to Postgres database'));
}

export default connection;