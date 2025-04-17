import express from 'express';
import ejs from 'ejs';


const app = express()
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: true
}))

app.get('/', (req, res)=>{
    res.render('index')
})

app.listen(3000, ()=>{
    console.log("App started on port 3000")
})