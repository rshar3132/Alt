import { Router } from 'express';
import {
  handleSearchFlights,
  handleGetAirport,
  handleGetRoute,
} from '../controllers/flightController.js';

const router = Router();

router.post('/search_flights', handleSearchFlights);       // POST /flights/search
router.post('/airport/:iata', handleGetAirport);   // POST /flights/airport/JFK
router.post('/route', handleGetRoute);             // POST /flights/route

export default router;