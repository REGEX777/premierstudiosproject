import express from 'express';
import axios from 'axios';
import City from '../models/favoriteCity.js'; 
import redisClient from '../utils/redisClient.js'; 
import calculateAQI from '../helper/aqi.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const apiKey = process.env.API_KEY;
  
    try {
      const cities = await City.find(); 
      const weatherData = [];
  
      for (const city of cities) {
        const cityName = city.name;
        const redisKey = `weather:${cityName.toLowerCase()}`;
  
        let cached = await redisClient.get(redisKey);
  
        if (!cached) {
          const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${cityName}&days=1&aqi=yes`;
          const { data } = await axios.get(url);
  
          const airQuality = data.current.air_quality;
          const aqi = calculateAQI(airQuality);
  
          const weather = {
            name: data.location.name,
            country: data.location.country,
            updatedAt: new Date().toLocaleTimeString(),
            icon: data.current.condition.icon.split('/').pop().replace('.png', ''),
            description: data.current.condition.text,
            temp: Math.round(data.current.temp_c),
            humidity: data.current.humidity,
            wind: Math.round(data.current.wind_kph / 3.6),
            precip: data.current.precip_mm,
            coords: {
              lon: city.longitude,
              lat: city.latitude,
            },
            aqi
          };
  
          await redisClient.set(redisKey, JSON.stringify(weather), { EX: 900 });
          weatherData.push(weather);
        } else {
          const parsed = JSON.parse(cached);
          
          parsed.coords = {
            lon: city.longitude,
            lat: city.latitude
          };
  
          weatherData.push(parsed);
        }
      }
      console.log(weatherData)
      res.render('favorite', { favorites: weatherData });
    } catch (err) {
      console.error('Error in /favorite:', err.message);
      res.render('favorite', { favorites: [], error: 'Could not load favorites' });
    }
  });

export default router;
