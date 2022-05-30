import connection from "../db.js";
import joi from "joi";

export async function getCustomers(req, res) {
    const cpf = req.query.cpf;

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

            res.send(customers.rows);
        }
    } catch {
        res.status(500).send('Server Error');
    }
}

export async function getCustomersById(req, res) {
    const id = req.params.id;
    try {
        const customer = await connection.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (customer.rows.length === 0) return res.status(404).send('Customer not found');
        res.send(customer.rows);
    } catch {
        res.status(500).send('Server Error');
    }
}

export async function postCustomers(req, res) {

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

}

export async function updateCustomers(req, res) {

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
}