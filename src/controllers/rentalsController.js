import connection from "../db.js";
import joi from "joi";
import dayjs from "dayjs";


export async function getRentals(req, res) {
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
}

export async function postRentals(req, res) {
    const date = dayjs(new Date()).format("YYYY-MM-DD")
    const { gameId, customerId, daysRented } = req.body;

    const schema = joi.object({
        customerId: joi.number().required(),
        gameId: joi.number().required(),
        daysRented: joi.number().min(1).required(),
    })

    const { error } = schema.validate(req.body, { abortEarly: false })
    if (error) {
        return res.status(400).send(error.details.map(d => d.message));
    }

    try {
        const customer = await connection.query('SELECT * FROM customers WHERE id = $1', [customerId]);
        const game = await connection.query('SELECT * FROM games WHERE id = $1', [gameId]);
        const rentalGame = await connection.query('SELECT * FROM rentals WHERE rentals."gameId" = $1', [gameId]);

        if (rentalGame.rows.length === game.rows[0].stockTotal) return res.status(400).send('Game is not available');
        if (customer.rows.length === 0) return res.status(400).send('Customer not found');
        if (game.rows.length === 0) return res.status(400).send('Game not found');

        await connection.query(`
                INSERT INTO rentals("customerId","gameId","rentDate","daysRented","returnDate","originalPrice","delayFee")
                VALUES ($1, $2, $3, $4, $5, $6, $7);
            `, [customerId, gameId, date, daysRented, null, daysRented * game.rows[0].pricePerDay, null])

        res.status(201).send('Rental created')


    } catch {
        res.status(500).send('Server Error');
    }
}

export async function finalizeRental(req, res) {
    const { id } = req.params;
    let delayFee = 0;

    try {
        const rental = await connection.query('SELECT * FROM rentals WHERE id = $1', [id]);
        const game = await connection.query('SELECT * FROM games WHERE id = $1', [rental.rows[0].gameId]);

        const date = dayjs(new Date()).format("YYYY-MM-DD")
        const lateDays = dayjs(date).diff(dayjs(rental.rows[0].rentDate, 'YYYY-MM-DD'), 'day');

        if (rental.rows.length === 0) return res.status(400).send('Rental not found');
        if (rental.rows[0].returnDate) return res.status(400).send('Rental already finalized');

        if (lateDays > 0) {
            delayFee = lateDays * game.rows[0].pricePerDay
        }

        await connection.query(`
            INSERT INTO rentals("customerId","gameId","rentDate","daysRented","returnDate","originalPrice","delayFee")
            VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [rental.rows[0].customerId, rental.rows[0].gameId, rental.rows[0].rentDate, rental.rows[0].daysRented, date, rental.rows[0].daysRented * game.rows[0].pricePerDay, delayFee])

        res.status(200).send('Rental updated')

    } catch {
        res.status(500).send('Server Error');
    }
}

export async function deleteRental(req, res) {
    const { id } = req.params;

    try {
        const rental = await connection.query('SELECT * FROM rentals WHERE id = $1', [id]);

        if (rental.rows.length === 0) return res.status(400).send('Rental not found');
        if (rental.rows[0].returnDate) return res.status(400).send('Rental already finalized');

        await connection.query('DELETE FROM rentals WHERE id = $1', [id]);

        res.status(200).send('Rental deleted')

    } catch {
        res.status(500).send('Server Error');
    }
}