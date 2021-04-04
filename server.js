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
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELPCODE_API_KEY=process.env.YELPCODE_API_KEY;

app.use(cors());
const options = NODE_ENV === 'production' ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } } : { connectionString: DATABASE_URL };

const pg = require('pg');
const client = new pg.Client(options);

function handelLocation(request, response) {
  
  let key = process.env.GEOCODE_API_KEY;
  
  const searchQuery = request.query.city;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${searchQuery}&format=json&limit=1`;
  const sql = 'SELECT * FROM locations WHERE search_query = $1';
  let cityArr = [searchQuery];
  
  client.query(sql, cityArr)
  .then(results => {
    
    if (results.rowCount) {
      
        superagent.get(url)
        .then(data => {
          const formattedArr = data.body.map((loc) => {
              return {
                search_query: searchQuery,
                formatted_query: loc.display_name,
                latitude: loc.lat,
                longitude: loc.lon
              };
            });
            let values = [searchQuery, formattedArr[0].formatted_query, formattedArr[0].latitude, formattedArr[0].longitude];
            let sql = 'INSERT INTO locations (search_query, formatted_query,latitude,longitude) VALUES ($1, $2,$3,$4) RETURNING *';
            client.query(sql, values)
            .then((results) => {
              response.json(formattedArr[0]);
            });
          })
          
          .catch((error) => {
            console.log('error from location', error);
            response.status(500).send('So sorry, something went wrong.');
          });
          
        } else {
          response.json(results.rows[0]);
        }
        
      }).catch(e => console.log(e.message, 'rejected'));
      
    };
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
async function handelWeather(request, response) {
  try {
    let key = process.env.WEATHER_API_KEY;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=Raleigh,NC&key=${key}`
    const rawWeatherData = await superagent.get(url);
    const weatherData = JSON.parse(rawWeatherData.text).data;
    
    // use map 
    const forecasts = weatherData.map(element => {
      const description = element.weather.description;
      const time = element.datetime;
      return new Weather(description, time);
      
    })
    response.json(forecasts);
    
  } catch(error)  {
    console.error(error);
    response.status(500).send('Something went wrong');
  }
  
  
} 
function handelMovie(request, response) {
  let key=process.env.MOVIE_API_KEY
  const url = `https://api.themoviedb.org/3/movie/550?api_key=${key}`

  superagent.get(url)
    .then(data => {
      // console.log(data.body);
      const movies=data.body.results.map(item => {
        let img=`https://image.tmdb.org/t/p/w500${item.poster_path}`
        const newObj=new Movie(item.title, item.overview, item.vote_average,img, item.vote_count, item.popularity, item.release_date)
      return newObj
      })
      response.statue(200).send(movies)
    })
    .catch((error) => {
      console.error(error);
      response.status(500).send('Something went wrong');
    })


}
function handleYelp (request,response){
  let key= process.env.YELPCODE_API_KEY;

  const url = `https://api.yelp.com/v3/businesses/search?accessToken=${key}Y&term=food`;
  superagent.get(url).set('Authorization', `Bearer ${key}`).then(data=> {
      const apiResYelp = data.body.results.map(yelpObj=>{
          const yelpData=new Yelp(yelpObj.name,yelpObj.image_url,yelpObj.price,yelpObj.rating,yelpObj.url);
          return yelpData;
      });
      response.status(200).send(apiResYelp);
  }) .catch((error) => {
    console.error(error);
    response.status(500).send(`Something went wrong${error}`);
  })

}

const handelError = (request, response) => {
  response.status(500).send('Sorry, something went wrong');
};



//Location  Constructor 
function Locations(city, location) {
  this.search_query = city;
  this.formatted_query = location.display_name;
  this.latitude = location.lat;
  this.longitude = location.lon;
}



// Weather Constructor
function Weather(description, valid_date) {
  this.forecast = description;
  this.time = valid_date; //.toDateString()
  
}
// Park Constructor
function Parks(name, address, fee, description, url) {
  this.name = name;
  this.address = address;
  this.fee = fee;
  this.description = description;
  this.url = url;
}
// Movie Constructor

function Movie(title, overview, average_votes, total_votes, image_url, popularity, released_on) {
  this.title = title;
  this.overview = overview;
  this.average_votes = average_votes;
  this.total_votes = total_votes;
  this.image_url = image_url;
  this.popularity = popularity;
  this.released_on = released_on;
}
// yelp
function Yelp (name,image_url,price,rating,url){
  this.name= name;
  this.image_url= image_url;
  this.price=price;
  this.rating=rating;
  this.url=url;
  
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


app.get('/location', handelLocation);
app.get('/weather', handelWeather);
app.get('/movie', handelMovie);
app.get('/yelp', handleYelp);
app.get('/', handleRequest);
app.use('*', handelError);


