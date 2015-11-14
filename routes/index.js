///<reference path='../../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/googlemaps/google.maps.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/google.geolocation/google.geolocation.d.ts'/> 
var AirportOperations;
(function (AirportOperations) {
    var Airport = (function () {
        function Airport(codeInput) {
            this.code = codeInput;
            this.name = "";
            this.temp = "";
            this.wind = "";
        }
        Airport.prototype.setName = function (nameInput) {
            this.name = nameInput;
        };
        Airport.prototype.setTemp = function (tempInput) {
            this.temp = tempInput;
        };
        Airport.prototype.setWind = function (windInput) {
            this.wind = windInput;
        };
        Airport.prototype.setLocation = function (location) {
            this.location = location;
        };
        Airport.prototype.getCode = function () {
            return this.code;
        };
        Airport.prototype.getName = function () {
            return this.name;
        };
        Airport.prototype.getTemp = function () {
            return this.temp;
        };
        Airport.prototype.getWind = function () {
            return this.wind;
        };
        Airport.prototype.getLocation = function () {
            return this.location;
        };
        return Airport;
    })();
    AirportOperations.Airport = Airport;
})(AirportOperations || (AirportOperations = {}));
///<reference path='../../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='./Airport.ts'/> 
var ServerCommService = (function () {
    /* To add here: Facebook login and FAA request */
    function ServerCommService(require) {
        this.http = require.http;
        console.log("http");
        console.log(this.http);
        this.express = require.express;
        this.mongo = require.mongo;
        this.monk = require.monk;
        this.db = require.db;
    }
    // Obtain airport codes from MongoDB and parse
    ServerCommService.prototype.parseCodes = function (callback) {
        var airportArray = new Array();
        var http = this.http;
        var waitClock = 0;
        var codeArray = new Array();
        var collection = this.db.get('airports');
        var trueThis = this;
        var skip = false;
        var tempAirportArray = new Array();
        collection.find({}, {}, function (err, aPorts) {
            for (var n = 0; n < aPorts.length; n++) {
                //console.log("iterate");
                //console.log(codeArray);
                codeArray.push(aPorts[n].IATA);
            }
            var count = 0;
            for (var n = 0; n < aPorts.length - 1; n++) {
                console.log("iterateFAAcall");
                http.get({
                    host: "services.faa.gov",
                    path: "/airport/status/" + codeArray[n] + "?format=application/JSON" }, function (res) {
                    res.setEncoding('utf8');
                    var body = ' ';
                    // Make body the response of the routing call
                    res.on('data', function (d) {
                        body += d;
                    });
                    // When data ends, parse the response
                    res.on('end', function () {
                        try {
                            var parsed = JSON.parse(body);
                        }
                        catch (err) {
                            console.error('Unable to parse response as JSON', err);
                            console.log(body);
                            count++;
                            skip = true;
                        }
                        if (!skip) {
                            var newAirport = new AirportOperations.Airport(parsed.IATA);
                            console.log(parsed.IATA);
                            console.log(parsed);
                            setTimeout(function () {
                                newAirport.setName(parsed.name);
                                newAirport.setTemp(parsed.weather.temp);
                                newAirport.setWind(parsed.weather.wind);
                                airportArray.push(newAirport);
                                console.log(count);
                                console.log(airportArray);
                                console.log("airports");
                                count++;
                                if (count == aPorts.length - 2)
                                    callback(airportArray);
                            }, 1000);
                        }
                        skip = false;
                    })
                        .on('error', function (err) {
                        // handle errors with request itself
                        console.error('Error with the request:', err.message);
                    });
                });
            }
        });
    };
    // Call to FAA and parse the result
    ServerCommService.prototype.airportRoutingCall = function (airCode, callback) {
        console.log("routing call");
        this.http.get({
            host: "services.faa.gov",
            path: "/airport/status/" + airCode + "?format=application/JSON" }, function (res) {
            res.setEncoding('utf8');
            var body = ' ';
            // Make body the response of the routing call
            res.on('data', function (d) {
                body += d;
            });
            // When data ends, parse the response
            res.on('end', function () {
                try {
                    var parsed = JSON.parse(body);
                }
                catch (err) {
                    console.error('Unable to parse response as JSON', err);
                }
                var newAirport = new AirportOperations.Airport(parsed.IATA);
                setTimeout(function () {
                    newAirport.setName(parsed.name);
                    newAirport.setTemp(parsed.weather.temp);
                    newAirport.setWind(parsed.weather.wind);
                    airportArray.push(newAirport);
                    callback();
                }, 1000);
            })
                .on('error', function (err) {
                // handle errors with request itself
                console.error('Error with the request:', err.message);
            });
        });
    };
    ;
    // Call the routing call for each airport in the list, codeArray is array of string
    ServerCommService.prototype.callAirports = function (codeArray, callback) {
        var waitClock = 0;
        var realThis = this;
        for (var i = 0; i < codeArray.length; i++) {
            console.log("callAirportsITerate");
            airportRoutingCall(codeArray[i], function () {
                if (++waitClock == codeArray.length) {
                    callback();
                }
            });
        }
    };
    ;
    // Return the array of airports!
    ServerCommService.prototype.getAirports = function () {
        return this.airportArray;
    };
    return ServerCommService;
})();
module.exports = ServerCommService.constructor();
///<reference path='../../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/googlemaps/google.maps.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/google.geolocation/google.geolocation.d.ts'/> 
var AirportOperations;
(function (AirportOperations) {
    var AirportMap = (function () {
        function AirportMap(mapDiv) {
            this.name = "AirportMap";
            this.options = {
                center: new google.maps.LatLng(53.83305, -1.66412),
                zoom: 3,
                MapTypeId: google.maps.MapTypeId.TERRAIN
            };
            this.map = new google.maps.Map(mapDiv, this.options);
        }
        AirportMap.prototype.getMap = function () {
            return this.map;
        };
        return AirportMap;
    })();
    AirportOperations.AirportMap = AirportMap;
})(AirportOperations || (AirportOperations = {}));
///<reference path='../../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/googlemaps/google.maps.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/google.geolocation/google.geolocation.d.ts'/> 
///<reference path='./Airport.ts'/> 
///<reference path='./AirportMap.ts'/> 
var AirportOperations;
(function (AirportOperations) {
    var AirportMarker = (function () {
        function AirportMarker(airportMap, airport) {
            this.map = airportMap.getMap();
            this.airport = airport;
            this.position = this.airport.getLocation();
            this.markerOptions = {
                position: this.position,
                clickable: true,
                map: this.map
            };
            console.log(this.airport);
            var airportInfo = '<div id="content">' +
                '<div id="siteNotice">' +
                '</div>' +
                '<h1 id="firstHeading" class="firstHeading">' + this.airport.getCode() + '</h1>' +
                '<div id="bodyContent">' +
                '<h3>Current temperature is ' + this.airport.getTemp() + ' .</h3>' +
                '<h3>Current wind speed is ' + this.airport.getWind() + ' .</h3>' +
                '</div>' +
                '</div>';
            this.marker = new google.maps.Marker(this.markerOptions);
            google.maps.event.addListener(this.marker, 'click', function () {
                var infoWindow = new google.maps.InfoWindow({
                    content: airportInfo,
                    maxWidth: 200
                });
                infoWindow.open(this.map, this);
            });
        }
        return AirportMarker;
    })();
    AirportOperations.AirportMarker = AirportMarker;
})(AirportOperations || (AirportOperations = {}));
///<reference path='../../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/googlemaps/google.maps.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/google.geolocation/google.geolocation.d.ts'/> 
///<reference path='./Airport.ts'/> 
///<reference path='./AirportMap.ts'/>
///<reference path='./AirportMarker.ts'/> 
var AirportOperations;
(function (AirportOperations) {
    var AirportGeocoder = (function () {
        function AirportGeocoder() {
            this.geocoder = new google.maps.Geocoder();
        }
        AirportGeocoder.prototype.getGeocoder = function () {
            return this.geocoder;
        };
        AirportGeocoder.prototype.geocodeAirports = function (map, airports) {
            var coordinates = Array();
            var length = airports.length;
            var geocoder = this.geocoder;
            geocodethis(map, coordinates, length, geocoder, airports);
            function geocodethis(map, coordinates, length, geocoder, airports) {
                var delay = 1000;
                var nextAddress = 0;
                next();
                function next() {
                    if (nextAddress < length) {
                        setTimeout(getGeoCodes, delay, nextAddress);
                        nextAddress++;
                    }
                }
                function getGeoCodes(nextAddress) {
                    geocoder.geocode({ 'address': airports[nextAddress].getCode() + " airport USA" }, function (results, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            console.log("Success!!" + nextAddress);
                            coordinates.push(results[0].geometry.location);
                            airports[nextAddress].setLocation(results[0].geometry.location);
                            createMarker(map, airports[nextAddress]);
                        }
                        else {
                            if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                                console.log("Limit Reached!!");
                                nextAddress--;
                                delay++;
                            }
                        }
                        next();
                    });
                }
            }
            var createMarker = function (map, airport) {
                var marker = new AirportOperations.AirportMarker(map, airport);
            };
        };
        return AirportGeocoder;
    })();
    AirportOperations.AirportGeocoder = AirportGeocoder;
})(AirportOperations || (AirportOperations = {}));
///<reference path='../../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/googlemaps/google.maps.d.ts'/> 
///<reference path='../../types/DefinitelyTyped/google.geolocation/google.geolocation.d.ts'/> 
///<reference path='./Airport.ts'/> 
///<reference path='./AirportMap.ts'/> 
///<reference path='./AirportMarker.ts'/> 
///<reference path='./AirportGeocoder.ts'/>
var AirportOperations;
(function (AirportOperations) {
    var BuildMap = (function () {
        function BuildMap(airports) {
            var mapCanvas = document.getElementById('map');
            var airportMap = new AirportOperations.AirportMap(mapCanvas);
            var airportGeocoder = new AirportOperations.AirportGeocoder();
            airportGeocoder.geocodeAirports(airportMap, airports);
        }
        return BuildMap;
    })();
    AirportOperations.BuildMap = BuildMap;
})(AirportOperations || (AirportOperations = {}));
function initMap() {
    var airports = new Array();
    airports.push(new AirportOperations.Airport("BHM"));
    airports.push(new AirportOperations.Airport("ANC"));
    airports.push(new AirportOperations.Airport("PHX"));
    airports.push(new AirportOperations.Airport("LIT"));
    airports.push(new AirportOperations.Airport("LAX"));
    airports.push(new AirportOperations.Airport("DEN"));
    airports.push(new AirportOperations.Airport("BDL"));
    airports.push(new AirportOperations.Airport("ILG"));
    airports.push(new AirportOperations.Airport("MIA"));
    airports.push(new AirportOperations.Airport("ATL"));
    airports.push(new AirportOperations.Airport("HNL"));
    airports.push(new AirportOperations.Airport("BOI"));
    airports.push(new AirportOperations.Airport("ORD"));
    airports.push(new AirportOperations.Airport("IND"));
    airports.push(new AirportOperations.Airport("DSM"));
    airports.push(new AirportOperations.Airport("MCI"));
    airports.push(new AirportOperations.Airport("SDF"));
    airports.push(new AirportOperations.Airport("MSY"));
    airports.push(new AirportOperations.Airport("BGR"));
    airports.push(new AirportOperations.Airport("BWI"));
    airports.push(new AirportOperations.Airport("BOS"));
    airports.push(new AirportOperations.Airport("DTW"));
    airports.push(new AirportOperations.Airport("MSP"));
    airports.push(new AirportOperations.Airport("GPT"));
    airports.push(new AirportOperations.Airport("STL"));
    airports.push(new AirportOperations.Airport("BZN"));
    airports.push(new AirportOperations.Airport("LNK"));
    airports.push(new AirportOperations.Airport("LAS"));
    airports.push(new AirportOperations.Airport("MHT"));
    airports.push(new AirportOperations.Airport("EWR"));
    airports.push(new AirportOperations.Airport("ABQ"));
    airports.push(new AirportOperations.Airport("JFK"));
    airports.push(new AirportOperations.Airport("CLT"));
    airports.push(new AirportOperations.Airport("FAR"));
    airports.push(new AirportOperations.Airport("CMH"));
    airports.push(new AirportOperations.Airport("OKC"));
    airports.push(new AirportOperations.Airport("PDX"));
    airports.push(new AirportOperations.Airport("PHL"));
    airports.push(new AirportOperations.Airport("PVD"));
    airports.push(new AirportOperations.Airport("CHS"));
    airports.push(new AirportOperations.Airport("FSD"));
    airports.push(new AirportOperations.Airport("BNA"));
    airports.push(new AirportOperations.Airport("DFW"));
    airports.push(new AirportOperations.Airport("SLC"));
    airports.push(new AirportOperations.Airport("BTV"));
    airports.push(new AirportOperations.Airport("IAD"));
    airports.push(new AirportOperations.Airport("SEA"));
    airports.push(new AirportOperations.Airport("IAD"));
    airports.push(new AirportOperations.Airport("MKE"));
    airports.push(new AirportOperations.Airport("JAC"));
    airports[0].setName("Birmingham-Shuttlesworth International Airport");
    airports[1].setName("Ted Stevens Anchorage International Airport");
    airports[2].setName("New Castle Airport");
    airports[3].setName("Miami International Airport");
    airports[0].setTemp("12 Degrees Celcius");
    airports[1].setTemp("5 Degrees Celcius");
    airports[2].setTemp("10 Degrees Celcius");
    airports[3].setTemp("25 Degrees Celcius");
    airports[0].setWind("50 km/h");
    airports[1].setWind("50 km/h");
    airports[2].setWind("60 km/h");
    airports[3].setWind("40 km/h");
    var buildNewMap = new AirportOperations.BuildMap(airports);
}
;
///<reference path='../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='../public/javascripts/ServerCommService.ts'/> 
///<reference path='../public/javascripts/Airport.ts'/> 
///<reference path='../public/javascripts/BuildMap.ts'/> 
var ViewRouter = (function () {
    function ViewRouter() {
    }
    ViewRouter.createRouter = function () {
        var express = require('express');
        var router = express.Router();
        var monk = require('monk');
        var airports = new Array();
        function checkAuthentication(request, response, next) {
            if (request.isAuthenticated()) {
                return next();
            }
            /*else{
                response.redirect('/');
            }*/
        }
        /* GET home page. */
        function obtainAirports() {
            console.log("obtaining airports");
            //scs = "potato";
            console.log(scs);
            scs.parseCodes(function () { this.airports = this.scs.getAirports(); });
        }
        router.get('/', function (req, res, next) {
            res.render('LoginView', { title: 'AirTime', user: req.user });
        });
        router.get('/RequestView', checkAuthentication, function (req, res) {
            res.render('RequestView', { title: 'AirTime', user: req.user });
        });
        router.get('/ResultView', checkAuthentication, function (req, res) {
            var results = [{ "code": "BHM", "name": "Birmingham-Shuttlesworth International Airport", "temp": "12 Degrees Celcius", "wind": "50 km/h" },
                { "code": "ANC", "name": "Ted Stevens Anchorage International Airport", "temp": "5 Degrees Celcius", "wind": "50 km/h" },
                { "code": "ILG", "name": "New Castle Airport", "temp": "10 Degrees Celcius", "wind": "60 km/h" },
                { "code": "MIA", "name": "Miami International Airport", "temp": "25 Degrees Celcius", "wind": "40 km/h" }];
            res.render('ResultView', { title: 'AirTime', resultsList: results, user: req.user });
            var serverCommInstance = new ServerCommService(req);
            var db = req.db;
            //console.log(db);
            //console.log(req);
            //console.log(serverCommInstance);
            serverCommInstance.parseCodes(function (airports) { this.airports = airports; console.log(airports); });
            //console.log(airports);
            res.render('RequestView', { title: 'AirTime', map: 'test' });
        });
        router.get('/ResultView', function (req, res) {
            res.render('ResultView', { title: 'AirTime', resultsList: this.airports });
        });
        router.get('/MapView', function (req, res) {
            console.log("map");
            console.log(this.airports);
            res.render('MapView', { title: 'MapView', results: this.airports });
        });
        /* GET Userlist page.
        router.get('/airportlist', function(req, res) {
            var db = req.db;
            var collection = db.get('airports');
            collection.find({},{},function(e,docs){
                    res.render('airportlist', {
                            "airportlist" : docs,
                            });
               });
        });*/
        return router;
    };
    return ViewRouter;
})();
module.exports = ViewRouter.createRouter();
var ServerCommService = (function () {
    /* To add here: Facebook login and FAA request */
    function ServerCommService() {
        var http = require('http');
        var express = require('express');
        var mongo = require('mongodb');
        var monk = require('monk');
        var db = monk('localhost:27017/sprint1db');
        var airportArray = new Array;
        // Obtain airport codes from MongoDB and parse
        function parseCodes(callback) {
            var waitClock = 0;
            var codeArray = new Array();
            var collection = db.get('airports');
            db.collection.find({}, {}, function (err, aPorts) {
                for (var n = 0; n < aPorts.length; n++) {
                    codeArray.push(aPorts[n].IATA, function () {
                        if (++waitClock == aPorts.length) {
                            callAirports(codeArray, function () {
                                callback();
                            });
                        }
                    });
                }
            });
        }
        // Call to FAA and parse the result
        function airportRoutingCall(airCode, callback) {
            http.get({
                host: "services.faa.gov",
                path: "/airport/status/" + airCode + "?format=application/JSON" }, function (res) {
                res.setEncoding('utf8');
                var body = ' ';
                // Make body the response of the routing call
                res.on('data', function (d) {
                    body += d;
                });
                // When data ends, parse the response
                res.on('end', function () {
                    try {
                        var parsed = JSON.parse(body);
                    }
                    catch (err) {
                        console.error('Unable to parse response as JSON', err);
                    }
                    var newAirport = new AirportOperations.Airport(parsed.IATA);
                    newAirport.setName(parsed.name);
                    newAirport.setTemp(parsed.weather.temp);
                    newAirport.setWind(parsed.weather.wind);
                    airportArray.push(newAirport);
                    callback();
                })
                    .on('error', function (err) {
                    // handle errors with request itself
                    console.error('Error with the request:', err.message);
                });
            });
        }
        ;
        // Call the routing call for each airport in the list, codeArray is array of string
        function callAirports(codeArray, callback) {
            var waitClock = 0;
            var realThis = this;
            for (var i = 0; i < codeArray.length; i++) {
                realThis.airportRoutingCall(codeArray[i], function () {
                    if (++waitClock == codeArray.length) {
                        callback();
                    }
                });
            }
        }
        ;
        module.exports = ServerCommService.constructor();
    }
    // Return the array of airports!
    ServerCommService.prototype.getAirports = function () {
        return this.airportArray;
    };
    return ServerCommService;
})();
