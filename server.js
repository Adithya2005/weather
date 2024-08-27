const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const weatherschema = require('./schema')
require('dotenv').config();

const app = express();
app.use(express.json())
let MONGOURL = process.env.MONGO_URL;
let PORT = process.env.PORT;
mongoose.connect(MONGOURL).then(() => {
  console.log("Database connected successfully.");
})

const collection = mongoose.model('Weather', weatherschema);
let Datetime = "2024-08-22"

let fetchData = async (city, startDate, endDate) => {
  let apiKey = process.env.VISUAL_CROSSING_API_KEY;
  let url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}%2CUK/${startDate}/${endDate}?unitGroup=us&key=${apiKey}`;

  let response = await axios.get(url);
  let weatherData = response.data;
  return weatherData.days.map(filteredDay => {
    let sunrise = filteredDay.sunrise;
    let sunset = filteredDay.sunset;

    let daytimeHours = filteredDay.hours.filter(hour => {
      const hourTime = parseInt(hour.datetime.split(':')[0]);
      return hourTime >= 4 && hourTime <= 18;
    });
    let totalTemp = daytimeHours.reduce((acc, hour) => acc + hour.temp, 0);
    let averageTemp = Math.round(totalTemp / daytimeHours.length);
    let windSpeed = daytimeHours[0].windspeed;
    let conditions = daytimeHours[0].conditions;
    let Humidityday = daytimeHours.reduce((acc, hour) => acc + hour.humidity, 0);
    let Humidity = Math.round(Humidityday / daytimeHours.length);

    let nighttimeHours = filteredDay.hours.filter(hour => {
      const hourTime = parseInt(hour.datetime.split(':')[0]);
      return hourTime >= 19 || hourTime < 4;
    });
    let condition = nighttimeHours[0].conditions;
    let windspeed = nighttimeHours[0].windspeed;
    let totalTempNight = nighttimeHours.reduce((acc, hour) => acc + hour.temp, 0);
    let averagetemp = Math.round(totalTempNight / nighttimeHours.length);
    let humidityNight = nighttimeHours.reduce((acc, hour) => acc + hour.humidity, 0);
    let humidity = Math.round(humidityNight / nighttimeHours.length);

    return {
      Location: weatherData.address,
      datetime: filteredDay.datetime,
      sunrise: sunrise,
      sunset: sunset,
      description: filteredDay.description,
      daytime: [{ averageTemp, conditions, windSpeed, Humidity }],
      nighttime: [{ averagetemp, condition, windspeed, humidity }],
    };
  });
};

app.get('/get', async (req, res) => {
    let city = req.query.city || 'London';
    let startDate = req.query.startdate || new Date().toJSON().slice(0, 10);
    let endDate = req.query.enddate;
    if (!endDate) {
      return res.status(400).send('End date is required');
    }
    let selectedData = await fetchData(city, startDate, endDate);
    res.json(selectedData);
});
app.post('/post', async (req, res) => {
      let city = req.query.city || 'London';
      let startDate = req.query.startdate || new Date().toJSON().slice(0, 10);
      let endDate = req.query.endDate;
      if (!endDate) {
        return res.status(400).send('End date is required');
      }
    try{
      let selectedData = await fetchData(city, startDate, endDate);

      let weatherDocument = await collection.findOne({ 
        "weatherReports.datetime": Datetime
      });
  
      if (!weatherDocument) {
        weatherDocument = new collection({
          weatherReports: selectedData
        });
        await weatherDocument.save();
        res.status(200).send({
          status:200,
          message: 'Weather data created successfully',
        })
      } else {

      for (let dayData of selectedData) {
        let ReportIndex = weatherDocument.weatherReports.findIndex(report => report.datetime === dayData.datetime);
  
        if (ReportIndex > -1) {
          weatherDocument.weatherReports[ReportIndex] = dayData;
        } else {
          weatherDocument.weatherReports.push(dayData);
        }
      }
      await weatherDocument.save();

      res.status(200).send({
        status : 200,
        message: "Data updated successfully",
      });  
     } 
    }catch(err){
      res.status(400).send({
        status : 400,
        message: "Error updating data",
      });
    }  
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});