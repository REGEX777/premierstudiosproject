import express from 'express';
import ejs from 'ejs';


const app = express()


app.get('/', ()=>{
    res.send("Works")
})

app.listen(3000, ()=>{
    console.log("App started on port 3000")
})