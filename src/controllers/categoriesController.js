import connection from "../db.js";
import joi from "joi";

export async function getCategories(req, res) {
    const { limit, offset } = req.query;

    try {
        const categories = await connection.query(`
                SELECT * FROM categories
                ORDER BY id
                LIMIT $1
                OFFSET $2
            `, [limit ? limit : null, offset ? offset : null]);
        res.send(categories.rows);


    } catch {
        res.status(500).send('Server Error');
    }
}

export async function postCategories(req, res) {

    const schema = joi.object({
        name: joi.string().required()
    })

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    try {
        const categoriVerification = await connection.query('SELECT * FROM categories WHERE name = $1', [req.body.name]);
        if (categoriVerification.rows.length > 0) res.status(409).send('Category already exists');
        else {
            const category = await connection.query('INSERT INTO categories (name) VALUES ($1)', [req.body.name]);
            res.send("Category created");
        }
    } catch {
        res.status(500).send('Server Error');
    }
}