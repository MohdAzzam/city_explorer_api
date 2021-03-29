'use strict';
const PORT = 3000;
require('dotenv').config();
const express = require('express'); // express framwork
const cors = require('cors'); //api call out of domain
const superagent = require('superagent');
const app = express();

app.use(cors());

app.listen(process.env.PORT || PORT, () => {
    console.log('Server Start at ' + PORT + ' .... ');
})
// constrctur function handle city location
let localCity=[];
function City(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
    localCity.push(this);
}

app.get('/location', handleLocation);
const myLocalLocations = {};
function handleLocation(req, response) {
    let city = req.query.city;
    let key = 'pk.538f70ca6f8929f9ab54209f14c5bd28';
    const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
    superagent.get(url).then(res => {
        const locationData = res.body[0];
        const location = new City(city, locationData);
        myLocalLocations.lat = locationData.lat;
        myLocalLocations.lon = locationData.lon;
        response.send(location);

    }).catch((err) => {
        console.log('ERROR !! ', err);
    });

}

/* constractor function that handel the weather in the same location */

function Weather(item) {
    this.time = item.datetime,
    this.forecast = item.weather.description
}
app.get('/weather', handleWeather);

function handleWeather(request, response) {
    let lat = myLocalLocations.lat;
    let lon = myLocalLocations.lon;
    console.log(lat, ' ', lon);
    let key = 'e469e0f7881e4974a5f2279ed3d14eda';
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`;
    superagent.get(url).then(res => {
        let currentWeather = [];
        res.body.data.map(item => {
            currentWeather.push(new Weather(item));
            return currentWeather;
        })
        response.send(currentWeather);
    }).catch(err => {
        response.status(404).send('requested API is Not Found!');
    })
}

function Park(park) {
    this.name =park.fullName,
    this.park_url=park.url,
    // this.location=park[0].addresses,
    this.fee='0',
    this.description=park.description
}
app.get('/parks', handelPark);

function handelPark(request, response) {
    let key = 'NGmpAlIwWG5l9s2B7J7FQgWcP5Yka9qhCKoGu0U2';
    const url = `https://developer.nps.gov/api/v1/parks?parkCode=la&limit=10&api_key=${key}`;
    superagent.get(url)
        .then(res => {
            let parks = [];
            res.body.data.map(item=>{
                parks.push(new Park(item))
                return parks;
            })
            response.send(parks)
        })
        .catch(err => {
            response.status(404).send('ERROR !!', err);
        })
}


app.use('*', (req, res) => {
    let status = 404;
    res.status().send({ status: status, message: 'Page Not Found' });
})

app.use(errorHandler);


function errorHandler(err, request, response, next) {
    response.status(500).send('something is wrong in server');
}
