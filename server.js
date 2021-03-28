'use strict';
const PORT = 3000;

const express = require('express'); // express framwork
const cors = require('cors'); //api call out of domain

const app = express();

app.use(cors());

app.listen(process.env.PORT || PORT, () => {
    console.log('Server Start at ' + PORT + ' .... ');
})
// constrctur function handle city location

function City(search_query, formatted_query, latitude, longitude) {
    this.search_query = search_query,
    this.formatted_query = formatted_query,
    this.latitude = latitude,
    this.longitude = longitude
}

app.get('/location', handleLocation);

function handleLocation(req, res) {
    const getLocation = require('./data/location.json'); // get the data from the json file
    console.log(req.query) // see the data was recived
    const search_query = req.query.city; //get the name that user entered
    const formatted_query = getLocation[0].display_name;
    const latitude = getLocation[0].lat;
    const longitude = getLocation[0].lon;
    let cityLocation = new City(search_query, formatted_query, latitude, longitude);
    console.log(cityLocation);
    res.send(cityLocation); //send the data to the frontend side
}

/* constractor function that handel the weather in the same location */

function Weather(time, description) {
    this.time = time,
    this.description = description
}
app.get('/weather', handleWeather);

function handleWeather(req, res) {
    const getWeather = require('./data/weather.json'); // get the data from the json file
    let array = [];

    let data = getWeather.data;
    console.log(data.length);
    data.forEach(((item) => {
        // eslint-disable-next-line no-unused-vars
        let weather = new Weather(item.valid_date,item.weather.description);
        array.push({ 'time': item.valid_date, 'forecast': item.weather.description })
    }))
    console.log(array);
    res.send(array);
}

