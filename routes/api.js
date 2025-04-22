import { resolveInclude } from 'ejs';
import express from 'express';
import mongoose from 'mongoose';

import City from '../models/favoriteCity.js';


const router = express.Router();


router.get('/autocomplete',async (req, res)=>{
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });
  
    try {
      const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(query)}&limit=10&sort=-population`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      });
  
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Something went wrong' });
    }
})

router.post('/add/fav', async (req, res) => {
    try {
      const { cityName, lat, long } = req.body;

      if (!cityName || !lat || !long) {
        return res.status(400).json({ error: 'All fields are required.' });
      }
  
      const latitude = parseFloat(lat);
      const longitude = parseFloat(long);
  
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Coordinates must be numbers.' });
      }
  
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Coordinates out of valid range.' });
      }
  
      const existing = await City.findOne({ name: cityName });
      if (existing) {
        return res.status(409).json({ error: 'City already exists in favorites.' });
      }
  
      const newCity = new City({
        name: cityName,
        latitude,
        longitude
      });
  
      await newCity.save();
      res.status(201).json({ message: 'City saved successfully!' });
  
    } catch (error) {
      console.error('Error saving city:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });


export default router;