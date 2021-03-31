/* eslint-disable indent */
'use strict';
const PORT = 3000;
require('dotenv').config();
const express = require('express'); // express framwork
const cors = require('cors'); //api call out of domain
const pg = require('pg');
const superagent = require('superagent');
const app = express();

const client = new pg.Client(process.env.DATABASE_URL);
console.log(process.env.DATABASE_URL);
// client.on('error', err => console.log("PG PROBLEM!!!"));
app.use(cors());



client.connect().then(() => {
    console.log('Runnnnnnnnnn');
    app.listen(process.env.PORT || PORT, () => {
        console.log('Server Start at ' + PORT + ' .... ');
    })
});

// constrctur function handle city location
let localCity = [];
function City(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
    localCity.push(this);
}


app.get('/', (req, res) => {
    let SQL = `SELECT * FROM location`;
    client.query(SQL).then(result => {
        res.send(result.rows);
    });
});


app.get('/location', handleLocation);
const myLocalLocations = {};

function handleLocation(req, response) {
    let search_query = req.query.city;
    console.log('--------------ds------------------');
    console.log(search_query)
    let key = process.env.GEOCODE_API_KEY;
    let SQL = 'SELECT * FROM location where search_query = $1';

    client.query(SQL, [search_query]).then(result => {
        if (result.rowCount > 0) {
            response.send(result.rows[0]);
            console.log(result.rows[0]);
            myLocalLocations.lat = result.rows[0].latitude;
            myLocalLocations.lon = result.rows[0].longitude;
        } else {
            const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${search_query}&format=json`;
            superagent.get(url).then(res => {
                const locationData = res.body[0];
                const location = new City(search_query, locationData);
                myLocalLocations.lat = locationData.lat;
                myLocalLocations.lon = locationData.lon;
                let SQL = 'INSERT INTO location (search_query, display_name,latitude,longitude) VALUES($1, $2,$3,$4) RETURNING *';
                let values = [search_query, locationData.display_name, locationData.lat, locationData.lon];
                client.query(SQL, values).then(result => {
                    response.send(location);
                    console.log(location);
                });

            }).catch((err) => {
                console.log('ERROR !! ', err);
            });
        }

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
    let key = process.env.WEATHER_API_KEY;
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

    this.name = park.fullName,
        this.park_url = park.url,
        // this.location=park[0].addresses,
        this.fee = '0',
        this.description = park.description
}
app.get('/parks', handelPark);

function handelPark(request, response) {
    let key = process.env.PARKS_API_KEY;
    let city = request.query.search_query;
    console.log(city);
    const url = `https://developer.nps.gov/api/v1/parks?q=${city}&limit=10&api_key=${key}`;
    superagent.get(url)
        .then(res => {
            let parks = [];
            res.body.data.map(item => {
                parks.push(new Park(item))
                return parks;
            })
            response.send(parks)
        })
        .catch(err => {
            response.status(404).send('ERROR !!', err);
        })
}

function Movies(data) {
    this.title = data.title,
        this.overview = data.overview,
        this.average_votes = data.vote_average,
        this.total_votes = data.vote_count,
        this.image_url = data.poster_path,
        this.popularity = data.popularity,
        this.released_on = data.released_on

}
app.get('/movies', (req, res) => {
    let key = process.env.MOVIE_API_KEY;
    let city = req.query.search_query;
    console.log(city);
    // city='amman';//testing 
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`;
    superagent.get(url).then(result => {
        // res.send(result.body.results);
        console.log('----------------------------------------------------');
        const finalResualt = result.body.results.map(item => new Movies(item));
        // console.log(finalResualt);
        res.send(finalResualt);

    }).catch(err => {
        console.log('Somthing Went Wrong !!');
    })
})

function Yelp(obj) {
        this.name = obj.name,
        this.image_url = obj.image_url,
        this.price = obj.price || '$$',
        this.rating = obj.rating,
        this.url = obj.url
}
app.get('/yelp', (req, res) => {
    let key = process.env.YELP_API_KEY;
    let city = req.query.search_query;
    console.log(req.query.page);
    let lat = myLocalLocations.lat;
    let lon = myLocalLocations.lon;
    console.log(lat, lon);
    console.log('DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAy');
    let url = `https://api.yelp.com/v3/businesses/search?categories=restaurants&limit=20&latitude=${lat}&longitude=${lon}`;
    superagent.get(url)
        .set('Authorization', 'Bearer FkskSX4w6hw1dQtMflGuGeMqKwkBF4a1tWUu_2uaV4MG6WAWWuEHpF6wLyls1qbb9tP8IVYB0FAUhkz1mqe2pR1x1J22ppdggNmAPrgz9i-f9DBibxDEMFoczaBkYHYx')
        .then(result => {
            // console.log(req.query.page);
            const allDres = result.body.businesses.map(item => new Yelp(item))
            console.log(typeof req.query.page,req.query.page);
            if (req.query.page === '1') {
                console.log('is this gonna be happen');
                res.send(Object.entries(allDres).slice(0, 5));
                console.log(Object.entries(allDres).slice(0, 5));
            } else if (req.query.page === '2') {
                res.send(Object.entries(allDres).slice(5, 10))
            } else if (req.query.page === '3') {
                res.send(Object.entries(allDres).slice(10, 15))
            }else if(req.query.page==='4'){
                res.send(Object.entries(allDres).slice(15,20))
            }else{
                res.send('There is no more');
            }
        })
        .catch(err => console.log('ERROR !!! POSTMAN', err))
});
app.use('*', (req, res) => {
    let status = 404;
    res.status().send({ status: status, message: 'Page Not Found' });
})

app.use(errorHandler);


function errorHandler(err, request, response, next) {
    response.status(500).send('something is wrong in server');
}
