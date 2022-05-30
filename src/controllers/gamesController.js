import connection from "../db.js";
import joi from "joi";

export async function getGames(req, res) {
    const { name, limit, offset } = req.query;
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
                ORDER BY games.id
                LIMIT $1
                OFFSET $2
                `, [limit ? limit : null, offset ? offset : null]);
            res.send(games.rows);
        }
        else {
            const games = await connection.query(`
                SELECT games.*, categories.name as "categoryName"
                FROM games
                JOIN categories ON games."categoryId" = categories.id
                ORDER BY games.id
                LIMIT $1
                OFFSET $2
            `, [limit ? limit : null, offset ? offset : null]);
            res.send(games.rows);
        }
    } catch {
        res.status(500).send('Server Error');
    }
}

export async function postGames(req, res) {

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

}