import { Router } from "express";
import { getCustomers, getCustomersById, postCustomers, updateCustomers } from "../controllers/customersController.js";

const customerRouter = Router();

customerRouter.get("/customers", getCustomers);
customerRouter.get("/customers/:id", getCustomersById);
customerRouter.post("/customers", postCustomers);
customerRouter.put("/customers/:id", updateCustomers);

export default customerRouter;