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



    try {
        const customer = await connection.query('SELECT * FROM customers WHERE id = $1', [req.body.customerId]);
        const game = await connection.query('SELECT * FROM games WHERE id = $1', [req.body.gameId]);
        if (customer.rows.length === 0) return res.status(404).send('Customer not found');
        if (game.rows.length === 0) return res.status(404).send('Game not found');


    } catch {
        res.status(500).send('Server Error');
    }

}