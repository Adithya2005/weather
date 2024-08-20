const express = require('express');
const axios = require('axios');
const math = require('math');
require('dotenv').config();

const app = express();
app.get('/weather', async (req, res) => {
  try {
    let city = req.query.city || 'London';
    let startDate = req.query.startdate || new Date().toJSON().slice(0, 10);
    let endDate = req.query.enddate;
    if (!endDate) {
      return res.status(400).send('End date is required');
    }
    let apiKey = process.env.VISUAL_CROSSING_API_KEY;
    let url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}%2CUK/${startDate}/${endDate}?unitGroup=us&key=${apiKey}`;

    let response = await axios.get(url);
    let weatherData = response.data;
    let selectedData = weatherData.days.map(filteredDay => {
      let sunrise = filteredDay.sunrise;
      let sunset = filteredDay.sunset;

      let daytimeHours = filteredDay.hours.filter(hour => {
        const hourTime = parseInt(hour.datetime.split(':')[0]);
        return hourTime >= 4 && hourTime <= 18;
      });
      let totalTemp = daytimeHours.reduce((acc, hour) => acc + hour.temp, 0);
      let averageTemp = math.round((totalTemp / daytimeHours.length));
      let windSpeed = daytimeHours[2].windspeed;
      let conditions = daytimeHours[2].conditions;
      let Humidityday = daytimeHours.reduce((acc, hour) => acc + hour.humidity, 0);
      let Humidity = math.round((Humidityday / daytimeHours.length));

      let nighttimeHours = filteredDay.hours.filter(hour => {
        const hourTime = parseInt(hour.datetime.split(':')[0]);
        return hourTime >= 19 || hourTime < 4;
      });
      let condition = nighttimeHours[0].conditions;
      let windspeed = nighttimeHours[2].windspeed;
      let totalTempNight = nighttimeHours.reduce((acc, hour) => acc + hour.temp, 0);
      let averagetemp = math.round((totalTempNight / nighttimeHours.length));
      let humidityNight = nighttimeHours.reduce((acc, hour) => acc + hour.humidity, 0);
      let humidity = math.round((humidityNight / nighttimeHours.length));

      return {
        Location: weatherData.address,
        datetime: filteredDay.datetime,
        sunrise: sunrise,
        sunset: sunset,
        description: filteredDay.description,
        Daytime: [{ averageTemp, conditions, windSpeed, Humidity }],
        Nighttime: [{ averagetemp, condition, windspeed,humidity }],
      };
    });

    res.json(selectedData);
    res.json("hello")
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});