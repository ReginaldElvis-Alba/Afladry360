import express from "express";
import dataController from "../../../Controllers/dataController.js";
const router = express.Router();

const {get_all_data, upload_to_blockchain}=dataController;

router.get("/all-data", get_all_data);
router.post("/upload-to-blockchain", upload_to_blockchain);

export default router;