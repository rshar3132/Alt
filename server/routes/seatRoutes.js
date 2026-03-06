import express from "express";
import { fetchBookedSeats, createBooking, storeBooking } from "../controllers/seatController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:flightId", fetchBookedSeats);
router.post("/book", createBooking);  //not needed anymore
router.post("/bookings", verifyJWT, storeBooking);

export default router;