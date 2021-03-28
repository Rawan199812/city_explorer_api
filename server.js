const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express(); // Creates a server application.
const PORT = process.env.PORT || 3000;

// Allow access to our api from another domain
app.use(cors());

app.get('/', (req, res) => {
    res.status(200);

    res.send('work!');
});

app.listen(PORT, () => console.log('app listening on port 3000!'));


app.get('/location', locationHandler);
// app.get("/weather", weatherHandler);

function locationHandler(request, response) {

  let cityName = request.query.cityName;


}

function getLocation(cityName) {
    const locationData = require('./data/geo.json');
}