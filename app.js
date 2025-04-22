import express from 'express';
import ejs from 'ejs';
import mongoose from 'mongoose';


mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Data connect hoe gaya sir jee lesfucking goooo");
    })
    .catch(err => console.log(err));

const app = express()
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: true
}))

import indexRoute from './routes/index.js'
import apiRoute from './routes/api.js'

app.use('/', indexRoute);
app.use('/api', apiRoute)
app.use('/weather', indexRoute)

// app.get('/', (req, res)=>{
//     res.render('index')
// })

app.listen(3000, ()=>{
    console.log("App started on port 3000")
})