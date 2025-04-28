import 'dotenv/config'
import express from 'express';
import axios from 'axios'
import City from '../models/favoriteCity.js';
import redisClient from '../utils/redisClient.js';
const router = express.Router()
import calculateAQI from '../helper/aqi.js';


router.get('/', async (req, res) => {
  const apiKey = process.env.API_KEY;
  const lat = req.query.lat;
  const lon = req.query.lon;
  const city = req.query.city || 'Boston';

  if (lat || lon) {
    if (isNaN(lat) || isNaN(lon)) {
      req.flash('error', 'Latitude and longitude must be valid numbers.');
      return res.redirect('/');
    }
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      req.flash('error', 'Latitude must be between -90 and 90 and longitude between -180 and 180.');
      return res.redirect('/');
    }
  } else if (city) {
    if (!/^[a-zA-Z\s\-]+$/.test(city.trim())) {
      req.flash('error', 'City name can only contain letters, spaces, and dashes.');
      return res.redirect('/');
    }
  }
  
  const locationQuery = lat && lon ? `${lat},${lon}` : city;
  const redisKey = `weather:${locationQuery.toLowerCase()}`;

  try {
      const cachedData = await redisClient.get(redisKey);

      if (cachedData) {
          console.log('Served from cache');
          const parsed = JSON.parse(cachedData);
          return res.render('index', {
              weather: parsed.weather,
              forecast: parsed.forecast,
              favorites: await City.find(),
              csrfToken: req.csrfToken()
          });
      }

      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${locationQuery}&days=7&aqi=yes`;
      const response = await axios.get(url);
      const data = response.data;

      const airQuality = data.current.air_quality;
      const aqi = calculateAQI(airQuality);

      const forecast = data.forecast.forecastday.map((day, index) => {
          const dateObj = new Date(day.date);
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
              sunset: data.forecast.forecastday[0].astro.sunset
          },
          weather: [{
              description: data.current.condition.text,
              icon: data.current.condition.icon.split('/').pop().replace('.png', '')
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
          aqi,
          uv: data.current.uv
      };

      await redisClient.set(redisKey, JSON.stringify({ weather, forecast }), { EX: 900 });

      res.render('index', { weather, forecast, favorites: await City.find(), csrfToken: req.csrfToken() });

  }catch (err) {
    console.error('Weather API error:', err.response?.data || err.message);
  
    let errorMessage;
  
    if (err.response?.data?.error?.code === 1006) {
      errorMessage = `No city found matching "${city}". Please check the spelling or select from the suggestions.`;
    } else if (err.response?.status === 404) {
      errorMessage = `City "${city}" not found.`;
    } else if (err.response) {
      errorMessage = `Unexpected error while fetching weather for "${city}".`;
    } else {
      return res.redirect('/');
    }
  
    req.flash('error', errorMessage);
    res.redirect('/');
  }
});



export default router;