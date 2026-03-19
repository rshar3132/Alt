// utils/agentTools.js
export const tools = [
  {
    type: "function",
    function: {
      name: "search_flights",
      description: "Search for available flights between two cities on a date",
      parameters: {
        type: "object",
        properties: {
          source:      { type: "string", description: "Departure city e.g. DEL" },
          destination: { type: "string", description: "Arrival city e.g. BOM" },
          departureDate:        { type: "string", description: "Date in YYYY-MM-DD format" },
          adults:       { type: "number", description: "Number of adult passengers" },
          children:    { type: "number", description: "Number of child passengers" }
        },
        required: ["source", "destination", "departureDate"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_bookings",
      description: "Get all existing bookings for the logged in user",
      parameters: {
        type: "object",
        properties: {}  // no input needed, userId comes from JWT
      }
    }
  },
  {
  type: "function",
  function: {
    name: "book_ticket",
    description: "Book a flight ticket for the user after confirming details",
    parameters: {
      type: "object",
      properties: {
        flightId:    { type: "string", description: "The FlightID from search results" },
        flightName:  { type: "string", description: "Airline name e.g. IndiGo" },
        source:      { type: "string", description: "Departure city IATA code" },
        destination: { type: "string", description: "Arrival city IATA code" },
        date:        { type: "string", description: "Departure date YYYY-MM-DD" },
        seats: {
          type: "array",
          description: "Array of seat objects to book",
          items: {
            type: "object",
            properties: {
              label:    { type: "string", description: "Seat label e.g. 3A" },
              category: { type: "string", description: "Business, Premium, or Economy" },
              price:    { type: "number", description: "Price for this seat in INR" }
            },
            required: ["label", "category", "price"]
          }
        },
        totalPrice: { type: "number", description: "Total price for all seats" },
        passengers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name:   { type: "string" },
              age:    { type: "number" },
              gender: { type: "string" }
            }
          }
        }
      },
      required: ["flightId", "flightName", "source", "destination", "date", "seats", "totalPrice", "passengers"]
    }
  }
},

{
    type: "function",
    function: {
      name: "cancel_booking",
      description: "Cancel an existing booking by its ID",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string", description: "MongoDB _id of the booking" }
        },
        required: ["bookingId"]
      }
    }
  }
];