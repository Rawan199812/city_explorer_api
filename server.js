'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent')


const app = express(); 
const PORT = process.env.PORT || 3000;

app.use(cors());
let locations={};

const handelLocation = (request,response)=>{
  // const location =require('./data/location.json');
  const city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;

  if (locations[url]) {
   
    response.send(locations[url]);
  } else {
    superagent.get(url)
    .then(data => {
    
    // https://us1.locationiq.com/v1/search.php?key=pk.97eb6319cc04540bb55f8dc4a7874b7e&q=Amman&format=json
    const location = data.body[0];
    const locationData  = new Locations (city,location);
    locations[url] = locationData;
    response.send(locationData);
    // response.json(locationData );

   
}) 
.catch((error) => errorHandler(error, request, response));  
}     
    } 
    function errorHandler(error, request, response) {
      response.status(500).send(error);
  }
    
  
  let weatherData = [];
  const handelWeather=(request,response)=>{
    const weather =require('./data/weather.json');
    let weatherArr = weather.data;
    // weatherArr.forEach(element => {
      //   let newW = new Weather(element.weather.description,element.valid_date);
      //   weatherData.push(newW)
      
      // use map 
      weatherData= weatherArr.map(element => {
        return new Weather(element.weather.description,element.valid_date);
        
      })  
      response.json(weatherData );
    };  
    const handelError = (request,response)=>{
      response.status(500).send('Sorry, something went wrong');
    };  
    
    

  
  //Location  Constructor 
  function Locations(city,location) {
    this.search_query = city;
    this.formatted_query =location.display_name;
    this.latitude = location.lat;
    this.longitude = location.lon;
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

