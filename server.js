const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const weatherschema = require('./schema');
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
app.use(express.json())
let MONGOURL = process.env.MONGO_URL;
let PORT = process.env.PORT;

mongoose.connect(MONGOURL).then(() => {
  console.log("Database connected successfully.");
})
.catch((err) => {
  console.log(err);
})
const collection = mongoose.model('weathers', weatherschema);
let Datetime = new Date().toJSON().slice(0, 10);

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
      location: weatherData.address,
      datetime: filteredDay.datetime,
      sunrise: sunrise,
      sunset: sunset,
      description: filteredDay.description,
      daytime: [{ averageTemp, conditions, windSpeed, Humidity }],
      nighttime: [{ averagetemp, condition, windspeed, humidity }],
    };
  });
};

//Create a document and update the new document
app.post('/post', async (req, res) => {
  let city = req?.body?.location ?? 'London';
  let startDate = req?.body?.startdate ?? new Date().toJSON().slice(0, 10);
  let endDate = req.body.enddate;
  if (!endDate) {
    return res.status(400).send({
      status: false,
      message: 'End date is required'
    });
  }
  try {
    let weatherData = await fetchData(city, startDate, endDate);

    let weatherDocument = await collection.findOne({
      "weatherReports.datetime": Datetime,
    })
    if (!weatherDocument) {
      weatherDocument = new collection({
        weatherReports: weatherData
      });
      await weatherDocument.save();
      res.status(200).send({
        status: true,
        message: 'Weather data Saved successfully',
        data: weatherData
      })
    } else {
      // for (let dayData of selectedData) {
      //   let ReportIndex = weatherDocument.weatherReports.findIndex(report => report.datetime === dayData.datetime && report.location === dayData.city);
      weatherData.forEach(dayData => {
        let weatherIndex = weatherDocument.weatherReports.findIndex(report =>
          report.datetime === dayData.datetime &&
          report.location === dayData.location
        );
        if (weatherIndex > -1) {
          weatherDocument.weatherReports[weatherIndex] = dayData;
        } else {
          weatherDocument.weatherReports.push(dayData);
        }
      });
      await weatherDocument.save();
      res.status(200).send({
        status: true,
        message: "Weather Data updated successfully",
        data:weatherData
      });
    }
  } catch (err) {
    res.status(400).send({
      status: false,
      message: "Error updating weather data",
    });
  }
});
//To get Specific date in mongoDb
app.get('/get', async (req, res) => {
  try {
    let city = req.query.city + ',UK';
    let startdate = req?.query?.startdate ?? new Date().toJSON().slice(0, 10);
    let enddate = req.query.enddate;

    if (!enddate && city) {
      let weatherDocument = await collection.findOne({
        "weatherReports.datetime": Datetime
      });
      res.status(200).send({
        status: true,
        message: 'Weather date retrieve successfully from mongoDB',
        data : weatherDocument
      })
    } else {

      let weatherDocument = await collection.findOne({
        "weatherReports.datetime": Datetime
      });
      let filterdate = weatherDocument.weatherReports.filter(report =>
        report.datetime >= startdate && report.datetime <= enddate && report.location == city
      );
      res.status(200).send({
        status : true,
        message : "weather data retrieve successfully for given date and city",
        Data : filterdate
      })
    }
  } catch (err) {
  res.status(400).send({
    status : false ,
    message : "Error retrieving data",
  })
}
});

app.delete('/delete', async (req, res) => {
  let weatherid = req.query.id;
  if (!weatherid) {
    res.status(400).send({
      status: false,
      message: "weatherId is required "
    })
  }
  try {
    let weatherDocument = await collection.findOne({
      "weatherReports._id": weatherid
    });
    if (!weatherDocument) {
      return res.status(404).send({
        status: false,
        message: "Weather Data not found",
      });
    }
    weatherDocument.weatherReports = weatherDocument.weatherReports.filter(report => report._id.toString() !== weatherid);
    await weatherDocument.save();
    res.status(200).send({
      status: true,
      message: "Weather Data deleted successfully",
    });
  } catch (err) {
    res.status(400).send({
      status: false,
      message: "Error deleting weather report",
    });
  }
});

app.put('/update', async (req, res) => {
  try {
      let { _id: weatherid, ...updateData } = req.body;
      
      if (!weatherid) {
          return res.status(400).send({
              status: false,
              message: "weatherId is required"
          });
      }
      let weatherDocument = await collection.findOne({
          "weatherReports._id": weatherid
      });

      if (!weatherDocument) {
          return res.status(404).send({
              status: false,
              message: "Weather Data not found",
          });
      }
      let weatherIndex = weatherDocument.weatherReports.findIndex(report => report._id.toString() === weatherid);
      if (weatherIndex > -1) {
          Object.assign(weatherDocument.weatherReports[weatherIndex], updateData);

          await weatherDocument.save();

          return res.status(200).send({
              status: true,
              message: "Weather Data updated successfully",
              Data : weatherDocument
          });
      } 

  } catch (err) {
      console.log(err);
      return res.status(400).send({
          status: false,
          message: "Error updating weather data"
      });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});