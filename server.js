const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

const city = 'chennai';

 const date = '2024-08-16';

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
  
  
    // const tempday = daytimeHours.hourTime;
    const selectedData = {
      address: weatherData.address,
      datetime: filteredDay.datetime,
      description : filteredDay.description,
     Daytimeavg: averageTemp,
     Nighttimeavg: averageTempNight
    //   days : filteredDay.hours,
    //   daytimeHours : daytimeHours.map(hour=>({ 
    //     datetime:hour.datetime,
    //     temp:hour.temp,
    //  }))
    };
   res.json(selectedData)

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
