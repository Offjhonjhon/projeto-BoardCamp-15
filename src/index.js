import express from 'express';
import cors from 'cors';
import joi from 'joi';
import dayjs from 'dayjs';

import connection from './db.js';

import categoryRouter from './routes/categoriesRouter.js';


const app = express();
app.use(cors());
app.use(express.json());

app.use(categoryRouter);


app.get("/games", async (req, res) => {
    const name = req.query.name;
    let capitalizedName = "";
    if (name) {
        capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    try {
        if (name) {
            const games = await connection.query(`
                SELECT games.*, categories.name as "categoryName"
                FROM games
                JOIN categories ON games."categoryId" = categories.id
                WHERE games.name LIKE '${capitalizedName}%'
                `);
            res.send(games.rows);
        }
        else {
            const games = await connection.query(`
                SELECT games.*, categories.name as "categoryName"
                FROM games
                JOIN categories ON games."categoryId" = categories.id
            `);
            res.send(games.rows);
        }
    } catch {
        res.status(500).send('Server Error');
    }
})

app.post("/games", async (req, res) => {

    const schema = joi.object({
        name: joi.string().required(),
        image: joi.string().required(),
        stockTotal: joi.number().greater(0).required(),
        categoryId: joi.number().required(),
        pricePerDay: joi.number().greater(0).required()
    })
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).send(error.details.map(d => d.message));
    }

    const validateCategory = await connection.query('SELECT * FROM categories WHERE id = $1', [req.body.categoryId]);
    const validateGameName = await connection.query('SELECT * FROM games WHERE name = $1', [req.body.name]);

    if (validateCategory.rows.length === 0) return res.status(400).send('Category does not exist');
    if (validateGameName.rows.length > 0) return res.status(409).send('Game already exists');

    try {
        const game = await connection.query(`
        INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") 
        VALUES ($1, $2, $3, $4, $5)`,
            [req.body.name, req.body.image, req.body.stockTotal, req.body.categoryId, req.body.pricePerDay]);

        res.send("Game created");
    } catch {
        res.status(500).send('Server Error');
    }

})

app.get("/customers", async (req, res) => {
    const cpf = req.query.cpf;
    const costumerSquema = {
        name: '',
        phone: '',
        cpf: '',
        birthday: ''
    }

    try {
        if (cpf) {
            const customers = await connection.query(`
                SELECT * FROM customers 
                WHERE customers.cpf LIKE '${cpf}%'
                `);
            res.send(customers.rows);
        }
        else {
            const customers = await connection.query(`
                SELECT * FROM customers
            `);
            console.log(customers.rows);
            res.send(customers.rows);
        }
    } catch {
        res.status(500).send('Server Error');
    }
})

app.get("/customers/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const customer = await connection.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (customer.rows.length === 0) return res.status(404).send('Customer not found');
        res.send(customer.rows);
    } catch {
        res.status(500).send('Server Error');
    }
})

app.post("/customers", async (req, res) => {

    const schema = joi.object({
        name: joi.string().required(),
        phone: joi.string().pattern(/^[0-9]{10,11}$/).required(),
        cpf: joi.string().pattern(/^[0-9]{11}$/).required(),
        birthday: joi.date().required()
    })

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details.map(d => d.message));
    }

    try {
        const customerVerification = await connection.query('SELECT * FROM customers WHERE cpf = $1', [req.body.cpf]);
        if (customerVerification.rows.length > 0) res.status(409).send('Customer already exists');
        else {
            const customer = await connection.query(`
                INSERT INTO customers (name, phone, cpf, birthday) 
                VALUES ($1, $2, $3, $4)`,
                [req.body.name, req.body.phone, req.body.cpf, req.body.birthday]);
            res.send("Customer created");
        }
    } catch {
        res.status(500).send('Server Error');
    }

})

app.put("/customers/:id", async (req, res) => {
    console.log(req.params.id)

    const schema = joi.object({
        name: joi.string().required(),
        phone: joi.string().pattern(/^[0-9]{10,11}$/).required(),
        cpf: joi.string().pattern(/^[0-9]{11}$/).required(),
        birthday: joi.date().required()
    })

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details.map(d => d.message));
    }

    try {
        const customerVerification = await connection.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
        const cpfVerification = await connection.query('SELECT * FROM customers WHERE cpf = $1', [req.body.cpf]);
        if (customerVerification.rows.length === 0) return res.status(404).send('Customer not found');
        if (cpfVerification.rows.length > 0) return res.status(409).send('CPF already exists');

        const customerUpdate = await connection.query(`
            UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5`,
            [req.body.name, req.body.phone, req.body.cpf, req.body.birthday, req.params.id]);

        res.status(200).send("Customer updated");
    } catch {
        res.status(500).send('Server Error');
    }
})

app.get("/rentals", async (req, res) => {
    const customerId = req.query.customerId;
    const gameId = req.query.gameId;
    let resultRentals = [];

    try {
        if (customerId) {
            resultRentals = await connection.query(`SELECT * FROM rentals WHERE rentals."customerId" = $1 `, [customerId])
        }
        else if (gameId) {
            resultRentals = await connection.query(`SELECT * FROM rentals WHERE rentals."gameId" = $1 `, [gameId])
        }
        else {
            resultRentals = await connection.query('SELECT * FROM rentals')
        }
        const resultCustomers = await connection.query('SELECT customers.id, customers.name FROM customers')
        const resultGames = await connection.query(`
            SELECT games.id, games.name, games."categoryId", categories.name as "categoryName"
            FROM games
            JOIN categories ON games."categoryId"=categories.id
        `)

        const rentals = resultRentals.rows.map(rental => ({
            ...rental,
            customer: resultCustomers.rows.find(customer => customer.id === rental.customerId),
            game: resultGames.rows.find(game => game.id === rental.gameId)

        }))
        res.send(rentals)

    } catch {
        res.status(500).send('Server Error');
    }
})

app.post("/rentals", async (req, res) => {
    const date = dayjs(new Date()).format("YYYY-MM-DD")



    try {
        const customer = await connection.query('SELECT * FROM customers WHERE id = $1', [req.body.customerId]);
        const game = await connection.query('SELECT * FROM games WHERE id = $1', [req.body.gameId]);
        if (customer.rows.length === 0) return res.status(404).send('Customer not found');
        if (game.rows.length === 0) return res.status(404).send('Game not found');


    } catch {
        res.status(500).send('Server Error');
    }

})




app.listen(4000, () => {
    console.log('Server is running on port 4000');
})