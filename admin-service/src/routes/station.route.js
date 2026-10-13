import express from "express";
import { createStation, getAllStations, getStationById, getStationByIdInternal } from "../controllers/station.controller.js";

import { getUserContext } from "../middlewares/getUserContext.middleware.js";
import { internalAuth } from "../middlewares/internalAuth.middleware.js";

const router = express.Router();

router.post("/station", getUserContext, createStation);

router.get("/station/internal/:stationId", internalAuth, getStationByIdInternal);

router.get("/station", getUserContext, getAllStations);
router.get("/station/:stationId", getUserContext, getStationById);

export default router;