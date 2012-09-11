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
var express = require('express');
var $ = require('jquery');
var _ = require('underscore');
 
/*
 * Global Variables and Constants
 */	
var predef_Sindice_query = "PREFIX analytics: <http://vocab.sindice.net/analytics#>  PREFIX any23: <http://vocab.sindice.net/>   SELECT DISTINCT ?class_label, ?class_card, ?property, ?property_card FROM <http://sindice.com/analytics> WHERE {       ?class any23:domain_uri <http://sindice.com/dataspace/default/domain/bbc.co.uk>	 .           ?class analytics:cardinality ?class_card.           ?class analytics:label ?bnode .           ?bnode analytics:label ?class_label .      ?bnode analytics:rank1 '1'^^xsd:integer.       ?edge analytics:publishedIn <http://sindice.com/dataspace/default/domain/bbc.co.uk>.      ?edge analytics:source ?class.       ?edge analytics:label ?property.      ?edge analytics:cardinality ?property_card.         FILTER(?class_card > 100)      FILTER(?property_card > 100)  }";

/*
 * Function Definitions
 */
function constructQuery(variables){
    // TODO
}

/* Turn the JSON returned result from Sindice into a graph model */
function prepareGraphModel(data){
    
    // initialise the graph model
    var model = { domain : "dummy.org", childClasses : {}, childClassProperties : {} };
    
    // get the SPARQL binding results
    var bindings = data.results.bindings;
    
    // for each result, incrementally construct the graph model
    _.each(bindings, function(r){
        
        // create instances of the child classes and their cardinalities
        var classURI = r['class_label'].value;
        var classCard = r['class_card'].value;        
        
        // add the child class
        model.childClasses[classURI] = classCard;
        
        // for each child class, append their associated properties and cardinalities
        var propertyURI = r['property'].value;
        var propertyCard = r['property_card'].value;
        
        // initialise the object if it hasn't been already
        if ( !_.isObject(model.childClassProperties[classURI]) ){
            model.childClassProperties[classURI] = {};
        }
        // add the child properties
        model.childClassProperties[classURI][propertyURI] = propertyCard;        
        
    });
    
    return model;
    
}


/*
 * Node.js Server Program
 */

// create the server using express.js
console.log("starting server...");
var server = express();

// tell express to parse HTTP requests into JSON
server.use(express.bodyParser());

// serve the webpage folder as a normal HTTP server
server.use(express.static('../webpage'));

// handle GET requests to the server
server.get('/activate', function(req, res){

    // GET request variables are available in req.query
    
    // get the URI of the dataset(s) to query
    var sindice_DatasetURI = req.query['dataset_uri'];
    
    // communicate with Sindice SPARQL ep to retrieve analytics
    model = $.ajax({
       url: 'http://sparql.sindice.com/sparql?query=' + escape(predef_Sindice_query),
       dataType: 'json',
       success: function(data, textStatus, jqXHR){
           // turn the returned data into the graph model
           res.send(prepareGraphModel(data));
       },
       error: function(jqXHR, textStatus, errorThrown){
           console.log(textStatus + " " + errorThrown);
       }
    });
      
});

/*
 * Start the server
 */ 
server.listen(8045);
