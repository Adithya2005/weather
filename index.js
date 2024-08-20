const express = require('express');
const axios = require('axios');
const app = express();

app.get('/',(req,res)=>{

    let url = `api.openweathermap.org/data/2.5/forecast?lat=44.34&lon=10.99&appid=4fc72351b423d3abc4d532fa1775a7a7`;
    let response = axios.get(url);
    let weatherData = response.data;
    res.send(weatherData)
});

app.listen(4000,()=>console.log("Server is Running on 4000"))
