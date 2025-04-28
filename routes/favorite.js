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
      let parsed;

      if (!cached) {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${cityName}&days=7&aqi=yes`;
        const { data } = await axios.get(url);

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
 
        const payload = { weather, forecast };
        await redisClient.set(redisKey, JSON.stringify(payload), { EX: 900 });

        parsed = payload;
      } else {
        parsed = JSON.parse(cached);
      }

      weatherData.push({
        name: parsed.weather.name,
        country: parsed.weather.country,
        updatedAt: new Date().toLocaleTimeString(),
        icon: parsed.weather.weather[0].icon,
        description: parsed.weather.weather[0].description,
        temp: Math.round(parsed.weather.main.temp),
        humidity: parsed.weather.main.humidity,
        wind: Math.round(parsed.weather.wind.speed),
        precip: parsed.weather.rain["1h"],
        coords: {
          lon: city.longitude,
          lat: city.latitude
        },
        _id: city._id,
        aqi: parsed.weather.aqi
      });
    }

    console.log(weatherData);
    res.render('favorite', { favorites: weatherData, csrfToken: req.csrfToken() });

  } catch (err) {
    console.error('Error in /favorite:', err.message);
    console.log(err);
    res.render('favorite', { favorites: [], error: 'Could not load favorites' });
  }
});

export default router;
