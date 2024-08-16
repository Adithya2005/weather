const express = require('express');
const axios = require('axios');
const query = require('query');
const { request } = require('http');
require('dotenv').config();

const app = express();

const city = req.query.body;

let current= new Date()
let currentdate = current.getDate();
let currentmonth = current.getMonth() + 1;
let currentyear = current.getFullYear();

let date = (`${currentyear}-0${currentmonth}-${currentdate}`)

app.get('/weather', async (req, res) => {

  const apiKey = process.env.VISUAL_CROSSING_API_KEY;
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}%2CUK?unitGroup=us&key=${apiKey}`;
 
    const response = await axios.get(url);
    const weatherData = response.data;

    const filteredDay = weatherData.days.find(day => day.datetime === date);

    const daytimeHours = filteredDay.hours.filter(hour => {
        const hourTime = parseInt(hour.datetime.split(':')[0]);
        return hourTime >= 4 && hourTime <= 18;
      });
      const totalTemp = daytimeHours.reduce((acc, hour) => acc + hour.temp, 0);
      const averageTemp = (totalTemp / daytimeHours.length)

      const NighttimeHours = filteredDay.hours.filter(hour => {
        const hourTime = parseInt(hour.datetime.split(':')[0]);
        return hourTime >= 19;
      });
      const totalTempNight = NighttimeHours.reduce((acc, hour) => acc + hour.temp, 0);
      const averageTempNight = (totalTempNight / NighttimeHours.length)
  
    const selectedData = {
      address: weatherData.address,
      datetime: filteredDay.datetime,
      description : filteredDay.description,
     Daytimeavg: averageTemp,
     Nighttimeavg: averageTempNight
    };
   res.json(selectedData)

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
