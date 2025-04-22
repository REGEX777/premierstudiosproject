import 'dotenv/config'
import express from 'express';
import axios from 'axios'

const router = express.Router()

function calculateAQI(airQuality) {
    const breakpoints = {
        co: [
            { low: 0, high: 4.4, aqiLow: 0, aqiHigh: 50 },
            { low: 4.5, high: 9.4, aqiLow: 51, aqiHigh: 100 },
            { low: 9.5, high: 12.4, aqiLow: 101, aqiHigh: 150 },
            { low: 12.5, high: 15.4, aqiLow: 151, aqiHigh: 200 },
            { low: 15.5, high: 30.4, aqiLow: 201, aqiHigh: 300 },
            { low: 30.5, high: 50.4, aqiLow: 301, aqiHigh: 500 },
        ],
        no2: [
            { low: 0, high: 53, aqiLow: 0, aqiHigh: 50 },
            { low: 54, high: 100, aqiLow: 51, aqiHigh: 100 },
            { low: 101, high: 360, aqiLow: 101, aqiHigh: 150 },
            { low: 361, high: 649, aqiLow: 151, aqiHigh: 200 },
            { low: 650, high: 1249, aqiLow: 201, aqiHigh: 300 },
            { low: 1250, high: 2049, aqiLow: 301, aqiHigh: 500 },
        ],
        o3: [
            { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
            { low: 55, high: 70, aqiLow: 51, aqiHigh: 100 },
            { low: 71, high: 85, aqiLow: 101, aqiHigh: 150 },
            { low: 86, high: 105, aqiLow: 151, aqiHigh: 200 },
            { low: 106, high: 200, aqiLow: 201, aqiHigh: 300 },
            { low: 201, high: 300, aqiLow: 301, aqiHigh: 500 },
        ],
        so2: [
            { low: 0, high: 35, aqiLow: 0, aqiHigh: 50 },
            { low: 36, high: 75, aqiLow: 51, aqiHigh: 100 },
            { low: 76, high: 185, aqiLow: 101, aqiHigh: 150 },
            { low: 186, high: 304, aqiLow: 151, aqiHigh: 200 },
            { low: 305, high: 604, aqiLow: 201, aqiHigh: 300 },
            { low: 605, high: 804, aqiLow: 301, aqiHigh: 500 },
        ],
        pm2_5: [
            { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },
            { low: 13, high: 35.4, aqiLow: 51, aqiHigh: 100 },
            { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },
            { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },
            { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },
            { low: 250.5, high: 500.4, aqiLow: 301, aqiHigh: 500 },
        ],
        pm10: [
            { low: 0, high: 54, aqiLow: 0, aqiHigh: 50 },
            { low: 55, high: 154, aqiLow: 51, aqiHigh: 100 },
            { low: 155, high: 254, aqiLow: 101, aqiHigh: 150 },
            { low: 255, high: 354, aqiLow: 151, aqiHigh: 200 },
            { low: 355, high: 424, aqiLow: 201, aqiHigh: 300 },
            { low: 425, high: 604, aqiLow: 301, aqiHigh: 500 },
        ]
    };

    function getSubIndex(pollutant, value) {
        const pollutantBreakpoints = breakpoints[pollutant];
        let subIndex = 0;
        for (let i = 0; i < pollutantBreakpoints.length; i++) {
            const breakpoint = pollutantBreakpoints[i];
            if (value >= breakpoint.low && value <= breakpoint.high) {
                subIndex = ((value - breakpoint.low) / (breakpoint.high - breakpoint.low)) * (breakpoint.aqiHigh - breakpoint.aqiLow) + breakpoint.aqiLow;
                break;
            }
        }
        return subIndex;
    }

    const pollutants = ['co', 'no2', 'o3', 'so2', 'pm2_5', 'pm10'];
    let maxAqi = 0;

    pollutants.forEach(pollutant => {
        const value = airQuality[pollutant];
        if (value !== undefined) {
            const subIndex = getSubIndex(pollutant, value);
            maxAqi = Math.max(maxAqi, subIndex);
        }
    });

    return maxAqi;
}



router.get('/', async (req, res) => {
    const apiKey = process.env.API_KEY;
    const lat = req.query.lat;
    const lon = req.query.lon;
    const city = req.query.city || 'Raipur';
    
    const locationQuery = lat && lon ? `${lat},${lon}` : city;
    
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${locationQuery}&days=7&aqi=yes`;
    
    try {
        const response = await axios.get(url);
        const data = response.data;
        const airQuality = data.current.air_quality;
        const aqi = calculateAQI(airQuality);
        console.log(data)
        const forecast = data.forecast.forecastday.map((day, index) => {
            const dateObj = new Date(day.date);
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            return {
                dayName: index === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
                date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                icon: day.day.condition.icon.split('/').pop().replace('.png', ''),
                maxTemp: Math.round(day.day.maxtemp_c),
                minTemp: Math.round(day.day.mintemp_c)
            };
        });
        
        const weather = {
            name: data.location.name,
            country: data.location.country,
            localtime: data.location.localtime,
            dt: Math.floor(new Date(data.location.localtime).getTime() / 1000),
            timezone: data.location.tz_id,
            coords: {
                lat: data.location.lat,
                lon: data.location.lon
            },
            sys: {
              sunrise: data.forecast.forecastday[0].astro.sunrise,
              sunset: data.forecast.forecastday[0].astro.sunset,
            },
            weather: [{
              description: data.current.condition.text,
              icon: data.current.condition.icon.split('/').pop().replace('.png', ''),
            }],
            main: {
              temp: data.current.temp_c,
              feels_like: data.current.feelslike_c,
              humidity: data.current.humidity,
              pressure: data.current.pressure_mb,
              dew_point: data.current.dewpoint_c ?? "—"
            },
            wind: {
              speed: data.current.wind_kph / 3.6
            },
            visibility: data.current.vis_km * 1000,
            rain: {
              "1h": data.current.precip_mm
            },
            aqi: aqi,
            uv: data.current.uv
          };
        console.log(weather.weather[0].icon)
        res.render('index', { weather, forecast });
    } catch (error) {
        console.error('WeatherAPI error:', error.response?.data || error.message);
        res.render('index', { weather: null, error: `Could not fetch weather for "${city}".` });
    }
});


export default router;