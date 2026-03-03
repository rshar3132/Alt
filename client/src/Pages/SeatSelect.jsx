import React, { useEffect, useState } from "react";
import axios from "axios";
import Flight_id from "../components/bookSeat/Flight_id";
import { UseBooking } from "../contexts/Useboooking";
import { useLocation } from "react-router-dom";

const SeatSelect = () => {
  const { bookingData } = UseBooking();
  const selectedFlight = bookingData?.selectedFlight;
  const location = useLocation();

  const totalPassenger = location.state?.TotalPassenger || 1;
  
  const [flight, setFlight] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine flight ID from context or location
    const flightId = selectedFlight?.flightID ?? location.state?.flightId;
    if (!flightId) return;
    console.log("Fetching data for Flight ID:", flightId);
    console.log("totalPassenger in SeatSelect:", totalPassenger);

    const fetchFlightData = async () => {
      try {
        const response = await axios.get(`/api/flight/${flightId}`);
        const flightData = response.data;

        setFlight(flightData);

        // Map booked seats
        // Assuming your API returns only booked seats
        const booked = flightData?.map(seat => seat.SeatNumber) ?? [];
        setBookedSeats(booked);

        console.log("Flight ID requested:", flightId);
        console.log("Booked seat response:", flightData);
      } catch (error) {
        console.error("Error fetching flight:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlightData();
  }, [selectedFlight, location.state]);

  if (!selectedFlight) {
    return (
      <p className="text-lg text-center text-red-500 mt-10">
        Please select a flight first.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-lg text-center text-gray-600 mt-10">
        Loading flight seats...
      </p>
    );
  }

  if (!flight?.length) {
    return (
      <p className="text-lg text-center text-gray-600 mt-10">
        No seats available for this flight.
      </p>
    );
  }

  return (
      <>
      {/* <h1 className="text-2xl font-bold text-center mb-6">
        Seat Selection - {selectedFlight.flightName}
      </h1> */}

      
        <Flight_id bookedSeats={bookedSeats} MaxSeatSelection={totalPassenger} />
      </>
  );
};

export default SeatSelect;
