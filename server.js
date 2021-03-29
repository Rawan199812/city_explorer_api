'use strict';
const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express(); 
const PORT = process.env.PORT || 3000;

app.use(cors());

const handelLocation = (request,response)=>{
  const location =require('./data/location.json');
  const city = request.query.city;
  const locationData  = new Locations (city,location);
  response.json(locationData );
};
const weatherData = [];
const handelWeather=(request,response)=>{
  const weather =require('./data/weather.json');
  let weatherArr = weather.data;
  weatherArr.forEach(element => {
    let newW = new Weather(element.weather.description,element.valid_date);
    weatherData.push(newW)
})
  response.json(weatherData );
};
const handelError = (req,res)=>{
  res.status(500).send('Sorry, something went wrong');
};

//Location  Constructor 
function Locations(city,location) {
  this.search_query = city;
  this.formatted_query =location[0].display_name;
  this.latitude = location[0].lat;
  this.longitude = location[0].lon;
}



// Weather Constructor
function Weather(forecast,time) {
  this.forecast=forecast;
  this.time=time; //.toDateString()
  
}

const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('work');
};



app.get('/location',handelLocation);
app.get('/weather',handelWeather);
app.get('/', handleRequest);
app.use('*', handelError);
app.listen(PORT, () => console.log('app listening on port 3000!'));

