import express from "express";
import { generateDiagramController, generateSchemaController } from "./ai.controller.js";
import { requiredAuth } from "../../middleware/auth.middleware.js";

const aiRouter = express.Router();

aiRouter.use(requiredAuth);

aiRouter.post("/generate-diagram", generateDiagramController);
aiRouter.post("/generate-schema", generateSchemaController);

export default aiRouter;
