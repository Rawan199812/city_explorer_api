'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent')


const app = express(); 
const PORT = process.env.PORT || 3000;
const PARKS_API_KEY = process.env.PARKS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;

app.use(cors());
const options = NODE_ENV === 'production' ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } } : { connectionString: DATABASE_URL };

const pg=require('pg');
const client=new pg.Client(options);

// client.connect()
//     .then(() => {
//         // This will only start out webserver if we connected successfully
//         app.listen(PORT, () => {
//             console.log(`App listening on port ${PORT}`);
//         })
//     }).catch(error => {
//         console.log('Unable to connect to database: ', error.message);
//     });


function handelLocation (request,response){
  // const city = request.query.city;

  let key = process.env.GEOCODE_API_KEY;

  const city = request.query.city;

  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
  const select = 'SELECT * FROM locations WHERE search_query = $1';

  client.query(select, [city])
    .then(results => {
      console.log(city);
      if (results.rowCount === 0) {

        superagent.get(url)
          .then(data => {
            const geoData = data.body[0];
            const locationInfo = new Locations(city, geoData);
            const { search_query, formatted_query, latitude, longitude } = locationInfo;
            let safeValues = [search_query, formatted_query, latitude, longitude];
            let sql = 'INSERT INTO locations (search_query, formatted_query,latitude,longitude) VALUES ($1, $2,$3,$4) RETURNING *';
            client.query(sql, safeValues)
              .then((data) => {
                response.json(data.rows[0]);
              });
          })

          .catch((error) => {
            console.log('error from location', error);
            response.status(500).send('So sorry, something went wrong.');
          });

      } else {
        response.json(results.rows[0]);
      }

    }).catch(e=>console.log(e.message,'rejected'));

};




  //end  
  app.get('/parks', handelPark);
  function handelPark(request, response) {
    const url = `https://developer.nps.gov/api/v1/parks?parkCode=acad&api_key=${PARKS_API_KEY}`;
    superagent.get(url).then(parksData => {
        const parks = parksData.body.data.map(data => {

            return new Parks(data.fullName, data.addresses[0].line1 + data.addresses[0].city, data.entranceFees[0].cost, data.description, data.url)
        });
        response.status(200).json(parks);
    }).catch((error) => {
        console.error(error);
        response.status(500).send('Something went wrong');
    })
}
  // let weatherData = [];
  async function handelWeather(request,response){
    try{
    let key = process.env.WEATHER_API_KEY;
    const url=`https://api.weatherbit.io/v2.0/forecast/daily?city=Raleigh,NC&key=${key}`
    const rawWeatherData = await superagent.get(url);
    const weatherData = JSON.parse(rawWeatherData.text).data;
      
      // use map 
      const forecasts= weatherData.map(element => {
        const description = element.weather.description;
        const time = element.datetime;
        return new Weather(description,time);
        
      })  
      response.json(forecasts );
    }catch(error) {
      console.error(error);
      response.status(500).send('Something went wrong');
  }
    
    }  
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
  function Weather(description,valid_date) {
    this.forecast=description;
    this.time=valid_date; //.toDateString()
    
  }
  // Park Constructor
  function Parks(name, address, fee, description, url) {
    this.name = name;
    this.address = address;
    this.fee = fee;
    this.description = description;
    this.url = url;
}
  
  const handleRequest = (request, response) => {
    console.log(request.query);
    response.send('work');
  };
  client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Connected to database:", client.connectionParameters.database);
      console.log('Server up on', PORT);
    });
  })
  .catch(err => {
    console.log('ERROR', err);
  });
  

app.get('/location',handelLocation);
app.get('/weather',handelWeather);
app.get('/', handleRequest);
app.use('*', handelError);
// app.listen(PORT, () => console.log('app listening on port 3000!'));

