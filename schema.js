const mongoose = require('mongoose')

const weatherSchema = new mongoose.Schema({
    weatherReports: [
      {
        location: String,
        datetime: String,
        sunrise: String,
        sunset: String,
        description: String,
        daytime: [{
          averageTemp: Number,
          conditions: String,
          windSpeed: Number,
          Humidity: Number,
        }],
        nighttime: [{
          averagetemp: Number,
          condition: String,
          windspeed: Number,
          humidity: Number,
        }],
      }
    ]
  });

  module.exports = weatherSchema;