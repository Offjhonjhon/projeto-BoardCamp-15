import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connection from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    const { rows } = await connection.query('SELECT * FROM categories');
    res.send(rows);
})

app.listen(4000, () => {
    console.log('Server is running on port 4000');
})