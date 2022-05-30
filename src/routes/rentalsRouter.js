import { Router } from "express";
import { getRentals, postRentals, finalizeRental, deleteRental } from "../controllers/rentalsController.js";

const customerRouter = Router();

customerRouter.get("/rentals", getRentals);
customerRouter.post("/rentals", postRentals);
customerRouter.post("/rentals/:id/return", finalizeRental);
customerRouter.delete("/rentals/:id", deleteRental);

export default customerRouter;