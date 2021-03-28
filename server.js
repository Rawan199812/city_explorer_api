const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express(); // Creates a server application.
const PORT = process.env.PORT || 3000;

// Allow access to our api from another domain
app.use(cors());

app.get('/', (req, res) => {
    res.send('An alligator approaches!');
});

app.listen(3000, () => console.log('Gator app listening on port 3000!'));