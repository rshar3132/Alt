import express from "express"
import cors from "cors"
import "dotenv/config";
import connectDB from "./configs/db.js";
import authRoutes from './routes/user.js';
import axios from "axios";
import flightRoutes from './routes/flightroutes.js';



connectDB()
const app = express();
app.use(express.json());
app.use(cors());

console.log('ENV CHECK:', {
  key:  process.env.FLIGHT_API_KEY,
  host: process.env.FLIGHT_API_HOST,
  url:  process.env.FLIGHT_API_BASE_URL,
});

app.get('/', (req,res)=>res.send("Api is working"));



const PORT = process.env.PORT || 3000;



app.use('/api', authRoutes);
app.use('/api', flightRoutes);

app.listen(PORT, ()=> console.log("working"))