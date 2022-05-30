import express from 'express';
import cors from 'cors';

import categoryRouter from './routes/categoriesRouter.js';
import gamesRouter from './routes/gamesRouter.js';
import customerRouter from './routes/customersRouter.js';
import rentalsRouter from './routes/rentalsRouter.js';


const app = express();
app.use(cors());
app.use(express.json());

app.use(categoryRouter);
app.use(gamesRouter);
app.use(customerRouter);
app.use(rentalsRouter);


app.listen(process.env.PORT, () => {
    console.log('Server is running on port ' + process.env.PORT);
})