import axios from 'axios';
import "dotenv/config"


// creating axios instance for Duffel API
/*
headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        Authorization: `Bearer ${DUFFEL_TOKEN}`,
      },

*/

const duffelAPI = axios.create({
    baseURL: process.env.DUFFEL_API_BASE_URL,
    headers:{
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${process.env.DUFFEL_API_KEY}`,
    },
    timeout: 15000,
});

//add caching layer here if needed
const cache = new Map();
const getCached = (key) => {
    const entry = cache.get(key);
    if(!entry || Date.now() > entry.expiresAt){//return if expired or not found
        cache.delete(key);
        return null;
    }
    return entry.data;//return cached data
}

//set cache with TTL (time to live)
const setCache = (key,data,ttlsecs=500)=>{
    cache.set(key,{
        data,
        expiresAt:Date.now()+ttlsecs*1000
    });
}

// we will normalize the response to match what our frontend expects
const normalizeFlight = (offer, index) => {
  const segment = offer?.slices?.[0]?.segments?.[0];

  return {
    FlightID: segment?.marketing_carrier_flight_number ?? `FL-${index}`,
    FlightName: segment?.operating_carrier?.name ?? 'Unknown Airline',
    Source: segment?.origin?.iata_code ?? '',
    Destination: segment?.destination?.iata_code ?? '',
    ArrivalTime: segment?.arriving_at ?? '',
    DepartureTime: segment?.departing_at ?? '',
    Price: offer?.total_amount ?? null
  };
};



export const searchFlightsDuffel = async ({ 
    source,
    destination,
    departureDate,
    returnDate,
    adults,
    children,
    cabinClass
    }) => {
    console.log("2. Duffel Service calling API with:", { source, destination, departureDate });
    try {
        //generate cache key
        const key = `flights:${source}:${destination}:${departureDate}:${returnDate}:${adults}:${children}:${cabinClass}`;
        const cached = getCached(key);//check cache first if we have results for this query
        if(cached) return cached;


        //for calling duffel API, we need to construct the request body according to their documentation
        /*
        slices : [
                    {
                    origin: "NYC",
                    destination: "ATL",
                    departure_date: "2021-06-21"
                    },
                    {
                    origin: "ATL",
                    destination: "NYC",
                    departure_date: "2021-07-21"
                    }
                ],
        passengers: [{ type: "adult" }, { type: "adult" }, { age: 1 }],
        cabin_class: "business",
        */

        const slices=[
            {
                origin : source,
                destination: destination,
                departure_date: departureDate,
            },
        ];
        if(returnDate){
            if(new Date(returnDate) <= new Date(departureDate)){
                throw new Error("returnDate must be after departureDate");
            }
            slices.push({
                origin: destination,
                destination: source,
                departure_date: returnDate,
            });
        }

        //for passengers, we need to create an array based on the number of adults and children
        const passengers = [];
        for(let i=0;i<adults;i++){
            passengers.push({ type: "adult" });
        }
        for(let i=0;i<children;i++){
            passengers.push({ age: 8 }); // Duffel API uses age for children, here we assume all children are 8 years old for simplicity
        }
        //cabin class can be economy, premium_economy, business, first
        const cabin_class = cabinClass;

        //if not cached, call Duffel API
        const {data} = await duffelAPI.post('/air/offer_requests',{
        
            data:{
                slices,
                passengers,
                cabin_class
            }
        });
        console.log("3. Duffel API Call successful");
        // Log raw once during dev so you can inspect actual response shape
        console.log('RAW DUFFEL API RESPONSE:', JSON.stringify(data, null, 2));
        //Duffel API nests results under data.offers
        const raw = data?.data?.offers ?? [];
        const results = Array.isArray(raw) ? raw.map(normalizeFlight) : [];
        setCache(key, results);
        return results;
    }
    catch(error){
        console.error("Duffel API Error:", error.response?.data || error.message);
        throw error;
    }

}

