/**
 * Author: Sean Policarpio
 * Date: 08.09.2012 19:13:27
 * About: A Node.js backend for the SPARQL spread activiation visualisation for the Sindice Dataset Summary Graph
 * 
 */
 
 /*
 * Imports
 */
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var express = require("express");
 
/*
 * Global Variables and Constants
 */	
// none yet

/*
 * Node.js Server Program
 */

// create the server using express.js
console.log("starting server...");
var server = express();

// parse HTTP requests into JSON
server.use(express.bodyParser());

// serve the webpage folder as a normal HTTP server
server.use(express.static('../webpage'));

// handle posts of ASP programs to the server
server.get('/activate', function(req, res){

    // GET request variables are available in req.query
    
    var sindiceSPARQLquery = req.query['squery'];
    
    res.send(200);
  
});

/*
 * Start the server
 */ 
server.listen(8045);
