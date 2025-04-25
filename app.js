import 'dotenv/config'
import express from 'express';
import ejs from 'ejs';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import session from 'express-session';
import flash from 'express-flash';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Data connect hoe gaya sir jee lesfucking goooo");
    })
    .catch(err => console.log(err));

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
app.use(helmet());

import indexRoute from './routes/index.js'
import apiRoute from './routes/api.js'
import favoriteRoute from './routes/favorite.js'

app.use('/', indexRoute);
app.use('/api', rateLimit({ windowMs: 15*60*1000, max: 100 }));
app.use('/api', apiRoute)
app.use('/weather', indexRoute)
app.use('/favorites', favoriteRoute)


// app.get('/', (req, res)=>{
//     res.render('index')
// })

app.listen(3000, ()=>{
    console.log("App started on port 3000")
})