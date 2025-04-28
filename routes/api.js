import {
  resolveInclude
} from 'ejs';
import express from 'express';
import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';


import City from '../models/favoriteCity.js';


const router = express.Router();


router.get('/autocomplete', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({
    error: 'Missing query'
  });

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
    res.status(500).json({
      error: 'Something went wrong'
    });
  }
})

router.post('/add/fav', async (req, res) => {
  try {
    const { cityName, lat, long } = req.body;

    if (!cityName || !lat || !long) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanCityName = sanitizeHtml(cityName, {
      allowedTags: [],
      allowedAttributes: {}
    }).trim();

    const cityNameRegex = /^[a-zA-ZÀ-ÿ\s\-']{1,100}$/;
    if (!cityNameRegex.test(cleanCityName)) {
      return res.status(400).json({ error: 'Invalid city name format.' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(long);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Coordinates must be numbers.' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Coordinates out of valid range.' });
    }

    const existing = await City.findOne({ name: cleanCityName });
    if (existing) {
      return res.status(409).json({ error: 'City already exists in favorites.' });
    }

    const newCity = new City({
      name: cleanCityName,
      latitude,
      longitude
    });

    await newCity.save();
    req.flash('success', 'City saved successfully!');
    res.redirect(`/weather?city=${cityName}&lat=${lat}&lon=${long}`);

  } catch (error) {
    console.error('Error saving city:', error);
    req.flash('error', 'Internal server error.');
    res.redirect(`/weather?city=${cityName}&lat=${lat}&lon=${long}`);
  }
});


router.delete('/delete/fav', async (req, res) => {
  try {
    const {
      id
    } = req.body

    if (!id) {
      return res.status(400).json({
        error: 'City ID is required.'
      })
    }

    const city = await City.findById(id)
    if (!city) {
      return res.status(404).json({
        error: 'City not found.'
      })
    }

    await City.findByIdAndDelete(id)
    req.flash('success', 'City deleted successfully.');
    res.redirect('/favorites');
  } catch (err) {
    console.error('Error deleting city:', err)
    req.flash('error', 'Something went wrong.');
    res.redirect('/favorites');
  }
})


export default router;