import { Router } from "express";
import { getCategories, postCategories } from "../controllers/categoriesController.js";

const categoryRouter = Router();

categoryRouter.get("/categories", getCategories);
categoryRouter.post("/categories", postCategories);

export default categoryRouter;