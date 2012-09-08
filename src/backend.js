/**
 * Author: Sean Policarpio
 * Date: 08.09.2012 19:13:27
 * About: A Node.js backend for the SPARQL spread activiation visualisation for the Sindice Dataset Summary Graph
 * 
 */
 
/*
 * Global Variables and Constants
 */	
// none

/*
 * Node.js Server Program
 */

// create the server using express.js
console.log("starting server...");
var server = express.createServer();

// parse HTTP requests into JSON
server.use(express.bodyParser());

// serve the webpage folder as a normal HTTP server
server.use(express.static('../webpage'));

// handle posts of ASP programs to the server
server.post('/activate', function(req, res){

	// stuff goes here
  
});

/*
 * Start the server
 */ 
server.listen(8045);
