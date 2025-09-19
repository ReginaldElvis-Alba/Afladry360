import express from "express";
import dataController from "../../../Controllers/dataController.js";
const router = express.Router();

const {get_all_data}=dataController;

router.get("/all-data", get_all_data);

export default router;