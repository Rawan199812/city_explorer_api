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
app.get('/location',handelLocation);


//Location  Constructor 
function Locations(city,location) {
  this.search_query = city;
  this.formatted_query =location[0].display_name;
  this.latitude = location[0].lat;
  this.longitude = location[0].lon;
}

const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('work');
};

app.get('/', handleRequest);

app.listen(PORT, () => console.log('app listening on port 3000!'));

