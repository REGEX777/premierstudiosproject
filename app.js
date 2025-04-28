import 'dotenv/config'
import express from 'express';
import ejs from 'ejs';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import session from 'express-session';
import flash from 'express-flash';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Data connect hoe gaya sir jee lesfucking goooo");
    })
    .catch(err => console.log(err));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests, please try again later.'
});
const app = express()
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: true
}))
app.use(methodOverride('_method'));
app.use(csrf());
app.use(limiter);

import indexRoute from './routes/index.js'
import apiRoute from './routes/api.js'
import favoriteRoute from './routes/favorite.js'

app.use('/', indexRoute);
app.use('/api', apiRoute)
app.use('/weather', indexRoute)
app.use('/favorites', favoriteRoute)

app.use((req, res, next) => {
    res.status(404);
    res.render('404', { url: req.originalUrl });
});
app.listen(3000, ()=>{
    console.log("App started on port 3000")
})