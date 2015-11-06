///<reference path='../../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../../types/DefinitelyTyped/express/express.d.ts'/> 
///<reference path='./Airport.ts'/> 
	class ServerCommService {

		airportArray: Array<AirportOperations.Airport>;

			/* To add here: Facebook login and FAA request */
		constructor(require) {
			this.http = require.http;
			console.log("http");
			console.log(this.http);
			this.express = require.express;
			this.mongo = require.mongo;
			this.monk = require.monk;
			this.db = require.db;
			this.airportArray = new Array;
		}

		  
		  // Obtain airport codes from MongoDB and parse
		  parseCodes(callback) {
		    var http = this.http;
			var waitClock = 0;
			var codeArray = new Array();
			var collection = this.db.get('airports');
			var trueThis = this;
			var skip = false;
			var tempAirportArray = new Array();
			collection.find({}, {}, function(err, aPorts) {
			  for (var n = 0; n<aPorts.length; n++) {
			    //console.log("iterate");
				//console.log(codeArray);
				codeArray.push(aPorts[n].IATA);
			  }
			  var count = 0;
			  for (var n = 0; n < aPorts.length-1; n++){//The last one isn't a valid IATA code, don't have time to fix atm
			    console.log("iterateFAAcall");
				http.get({
			    host: "services.faa.gov",
			    path: "/airport/status/" + codeArray[n] + "?format=application/JSON",},
			    function(res) {
				  res.setEncoding('utf8');
				  var body = ' ';

			  	// Make body the response of the routing call
			  	res.on('data', function(d) {
				  body += d;
				});

				// When data ends, parse the response
				res.on('end', function() {
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
				  setTimeout(function() {
					newAirport.setName(parsed.name);
					newAirport.setTemp(parsed.weather.temp);
					newAirport.setWind(parsed.weather.wind);
					trueThis.airportArray.push(newAirport);
					console.log(count);
					count++;
					if (count == aPorts.length -2)callback();
				  }, 1000);}
				  skip = false;
				})


				// Routing Call error message
				.on('error', function(err) {
				  // handle errors with request itself
				  console.error('Error with the request:', err.message);
				});

			  })
			}});
		  }

		  // Call to FAA and parse the result
		  airportRoutingCall(airCode: string, callback){
		    console.log("routing call");
			this.http.get({
			  host: "services.faa.gov",
			  path: "/airport/status/" + airCode + "?format=application/JSON",},
			  function(res) {
				res.setEncoding('utf8');
				var body = ' ';

				// Make body the response of the routing call
				res.on('data', function(d) {
				  body += d;
				});

				// When data ends, parse the response
				res.on('end', function() {
				  try {
					var parsed = JSON.parse(body);
				  }
				  catch (err) {
					console.error('Unable to parse response as JSON', err);
				  }

				  var newAirport = new AirportOperations.Airport(parsed.IATA);
				  setTimeout(function() {
					newAirport.setName(parsed.name);
					newAirport.setTemp(parsed.weather.temp);
					newAirport.setWind(parsed.weather.wind);
					airportArray.push(newAirport);
					callback();
				  }, 1000);
				})


				// Routing Call error message
				.on('error', function(err) {
				  // handle errors with request itself
				  console.error('Error with the request:', err.message);
				});

			  })
		  };

		  // Call the routing call for each airport in the list, codeArray is array of string
		  callAirports(codeArray, callback){
			var waitClock = 0;
			var realThis = this;
			for (var i =0; i< codeArray.length; i++) {
			  console.log("callAirportsITerate");
			  airportRoutingCall(codeArray[i], function() {
				if(++waitClock == codeArray.length) {
				  callback();
				}
			  });

			}
		  };
          		// Return the array of airports!
		getAirports() {
		  return this.airportArray;
		}
		}
		module.exports = ServerCommService.constructor();