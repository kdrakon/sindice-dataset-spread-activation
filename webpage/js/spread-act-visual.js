/**
 * Author: Sean Policarpio
 * Date: 12.09.2012 13:54:03
 * 
 * Purpose: This source is primarily concerned with taking a model generated from the node.js 
 * backend that contains a spreading activation of RDF analytics from Sindice. This frontend will
 * create a 3D model using the Three.js library.
 * 
 */
 
 /*
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 * 
 */ 
 
/********************************************************************
 * Global Variables
 *******************************************************************/
var W = 800, H = 500; // these will be overwritten by the actual size of the canvases div
var GEOMETRIC_SEGMENTS = 8;
var MOON_EDGE_COLOR = 0x405744, PLANET_EDGE_COLOR = 0x405744;
var PLANET_COLOR = 0x008CC3, MOON_COLOR = 0x9765C9, DOMAIN_COLOR = 0x10A326, HIGHLIGHT_COLOR = 0xF58718;
var MIN_DISTANCE_FOR_HIGHLIGHT = 100;
var PLANET_RADIUS_FACTOR = 5;
var RADIUS_OF_BIGGEST_NODE = 0; // these will be overwritten when the model is generated
var PLANET_DISTANCE_FACTOR = 20;
var MOON_DISTANCE_FACTOR = 1/4;

var globalScene, globalRenderer, globalCamera, globalControls;
var galaxyModel = {};
var highlightNode;

/********************************************************************
 * Three.js Methods
 ********************************************************************/
 
function sqr(x) { return x*x; } 
 
/* prepare THREE.js environment */
function prepare3JS(){
    
    var container = $('#canvas-holder'); 
    W = container.width(); H = container.height();
    
    globalRenderer = new THREE.CanvasRenderer();
    globalRenderer.setSize(W, H);
    
    globalCamera = new THREE.PerspectiveCamera(45, W/H, 0.1, 5000);
    globalCamera.position = new THREE.Vector3(0, 25, 175);
    
    // attach the trackballcontrols to the camera
    globalControls = new THREE.TrackballControls( globalCamera, globalRenderer.domElement );
    globalControls.noPan = true;
    globalControls.rotateSpeed = 0.5;
    globalControls.target.set( 0, 0, 0 );
    
    container.append(globalRenderer.domElement);
    
}

/* Render the scene */
function renderModel(renderer, scene, camera){
    
    // update the trackball controls movements
    globalControls.update();
    
    // re-render the scene
    renderer.clear();    
    renderer.render(scene, camera);    
}

/* 
 * Animate/render the model 
 */
function animate(){    

    setInterval(function(){
        // TODO replace with requestanimationframe
        
        // render the changes
        renderModel(globalRenderer, globalScene, globalCamera);
    }, 13);
    
}

/* will construct and return the whole 3D model in a Three.js scene */
function create3DModel(model){
    
    // reset the object containing the 3D model
    galaxyModel = {};
    
    // create the planet nodes with the domain URI as the root
    generate3DPlanets(model, model['domain'], galaxyModel, PLANET_COLOR); 
    
}

/* recursive function for activation model that will create the 3D node planets */
function generate3DPlanets(model, URIIndex, galaxy, node_color){
    
    var PARENT = 0, CARD = 1, A = 2;
    var sector = 0;
    
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: node_color });    
    
    _.each(model.nodes, function(node, URIkey){
        
        // select only child nodes of parent (URIIndex)
        if(node[PARENT] == URIIndex){
            
            // create child planet sphere
            var radius = node[A] * PLANET_RADIUS_FACTOR;
            var planet = new THREE.Mesh( new THREE.SphereGeometry(radius, GEOMETRIC_SEGMENTS, GEOMETRIC_SEGMENTS), sphereMaterial);
            planet['uri'] = URIkey;

            // append the planet and text to the array
            galaxy[sector] = { 'planet' : planet, 'moons' : {} };            
            
            // remove this node from the model since were done with it
            delete model.nodes[URIkey]; 
            // recursively create child planets
            generate3DPlanets(model, URIkey, galaxy[sector].moons, MOON_COLOR);
            
            // replace PLANET_DISTANCE_TO_CENTRE with the greatest sized radius*2
            if (radius > RADIUS_OF_BIGGEST_NODE){
                RADIUS_OF_BIGGEST_NODE = radius;
            }
            
            // increment to next sector
            sector++;
        }
        
    });
    
}

/* Plots the 3D generated planets in the galaxy model on to the scene */
function plotPlanetsInScene(galaxy, scene, plotCentre, galaxyRadius, edges, edge_color){
    
    // first check if this galaxy (or sub-galaxy/moons) has any planets. if not, skip this iteration
    var numOfPlanets = _.keys(galaxy).length;
    if (numOfPlanets == 0){
        return;
    }
    
    // rotation calculations for planets
    var rotationAngle = (360 / numOfPlanets) * (Math.PI / 180);  
    var currentRotation = rotationAngle;

    // first, set the plotting position relative to the plot centre and the above computed radius
    var currentPlotPosition = new THREE.Vector3();
    currentPlotPosition.copy(plotCentre);    
    currentPlotPosition.setZ(currentPlotPosition.z + galaxyRadius); // move towards user
    
    // for each sector (index) and subsectors (subindexes), plot the sphere planets in the scene
    _.each(galaxy, function(sector, sector_id){
       
        // NOTE: the "sector" object has a planet and moons array
        
        // plot the current planet
        sector.planet.position.copy(currentPlotPosition);
        scene.add(sector.planet);
        
        // append a navigation link
        appendNavigationLink(sector.planet.uri, currentPlotPosition);
        
        // draw an edge from the plotcentre to this planet if the option is on
        if (edges){
            var line_geometry = new THREE.Geometry();
            line_geometry.vertices.push( plotCentre ); 
            line_geometry.vertices.push( new THREE.Vector3(currentPlotPosition.x, currentPlotPosition.y, currentPlotPosition.z) );
            var line = new THREE.Line( line_geometry, new THREE.LineBasicMaterial( { color: edge_color } ));
            scene.add(line);     
        }   
    
        // next, recursively plot the moons around this planet
        plotPlanetsInScene(sector.moons, scene, new THREE.Vector3(currentPlotPosition.x, currentPlotPosition.y, currentPlotPosition.z), galaxyRadius * MOON_DISTANCE_FACTOR, edges, MOON_EDGE_COLOR);
        
        // rotate the plot position for the next sectors to use
        var z = plotCentre.z + (galaxyRadius * Math.cos(currentRotation));
        var x = plotCentre.x + (galaxyRadius * Math.sin(currentRotation));        
        currentPlotPosition.setX(x);
        currentPlotPosition.setZ(z);        
        
        // increment rotation for next sectors planet
        currentRotation += rotationAngle;            
        
    });    
    
}
/* Prepare the scene before rendering */
function prepareScene(scene){
    
    var centreOfUniverse = new THREE.Vector3( 0, 0, 0 );
    
    // reset the scene where all 3D objects will be appended
    scene = new THREE.Scene();
    
    // clear the navigation links
    clearNavigationLinks();
    
    // recursively plot the generated planet nodes from the model
    plotPlanetsInScene(galaxyModel, scene, centreOfUniverse, RADIUS_OF_BIGGEST_NODE * PLANET_DISTANCE_FACTOR, $('#edges').prop("checked"), PLANET_EDGE_COLOR);
    
    return scene;
    
}

/* 
 * Based on the current position of the camera, this recursive function will determine the closest planet that the user 
 * is most likely viewing. It will also return the radius of the highlight node as well as other useful
 * data. TODO: a better way to implement this may be using a "ray" from the cameras POV
 */ 
function determineHighlightPosition(minNodeDistance, galaxy, cameraPosition, currentTarget){
    
    // define the position and radius of the highlight
    var highlightPosition = new THREE.Vector3();
    var radius = 0.0;
    var sectorURI = "";
    
    _.each(galaxy, function(sector, sector_id){
        
        // create a label and highlight at this planet IF the camera is close enough
        var distanceToCamera = sector.planet.position.distanceTo(cameraPosition) - sector.planet.boundRadius;
        
        if (distanceToCamera < minNodeDistance){
            // mark the position and get the radius
            highlightPosition.copy(sector.planet.position);
            radius = sector.planet.boundRadius;
            
            // keep track of the shortest distance
            minNodeDistance = distanceToCamera;
            
            // save the URI
            sectorURI = sector.planet.uri;
            
            // now recursively check if this planets sub-planets are even closer
            var numOfSubPlanets = _.keys(sector.moons).length;
            if (numOfSubPlanets){
                var ret = determineHighlightPosition(minNodeDistance, sector.moons, cameraPosition, currentTarget);
                
                // replace the highlight position et. al if its closer; if not, ignore the returned values
                if (distanceToCamera > ret.minNodeDistance){                
                    highlightPosition.copy(ret.highlightPosition);
                    radius = ret.radius;       
                    minNodeDistance = ret.minNodeDistance;
                    sectorURI = ret.sectorURI;         
                }
            }
        }
    
    });
    
    return {'highlightPosition':highlightPosition, 'radius':radius, 'minNodeDistance':minNodeDistance, 'sectorURI':sectorURI};    
}

/*
 * This method will plot the highlight node on the scene as well as provide the label for the currently
 * highlighted node.
 */
function plotHighlightNode(scene, galaxy, cameraPosition, controlsTarget){
    
    // first check if the scene even exists yet
    if (scene !== undefined){
        
        // remove the highlightnode (global) first
        scene.remove(highlightNode);
        
        // determine the highlight nodes position and other parameters
        var ret = determineHighlightPosition(MIN_DISTANCE_FOR_HIGHLIGHT, galaxy, cameraPosition, controlsTarget);
    
        // create a new highlight node which will be added to the scene
        highlightNode = new THREE.Mesh( 
            new THREE.SphereGeometry(ret.radius+0.1, GEOMETRIC_SEGMENTS, GEOMETRIC_SEGMENTS), 
            new THREE.MeshBasicMaterial({ color: HIGHLIGHT_COLOR })
        );        
        highlightNode.position.copy(ret.highlightPosition);
        
        // set the node label on the view
        $('#node-label').text(ret.sectorURI);

        // finally, add the highlight node
        scene.add(highlightNode);
        
    }   
    
}

/*
 * Will focus the camera on a vector position given
 */
function pointCamera(x,y,z){
    
    // TODO Zoom in on node
    globalControls.target.copy(new THREE.Vector3(x,y,z));    
    
}

/*
 * Reset the Trackball controls back on the center of the scene
 */
function resetView(){
    if (globalControls !== undefined){
        globalControls.target.copy(new THREE.Vector3(0,0,0));
    } 
}

/*
 * Determine node selection from the user.
 * From: http://stackoverflow.com/questions/11036106/three-js-projector-and-ray-objects
 */
function selectNode(galaxy, camera, mouseX, mouseY){
    
    // copy the 2D mouse vector
    var mouse3D = new THREE.Vector3();
    mouse3D.x = (mouseX / W) * 2 - 1;
    mouse3D.y = -(mouseY / H) * 2 + 1;
    mouse3D.z = 0.5;

    // use the 2D vector with the projector to create a picking ray
    var projector = new THREE.Projector();    
    var ray = projector.pickingRay( mouse3D, camera );
    
    // now look for any objects that intersect the ray
    _.each(galaxy, function(sector, sector_id){
       
       var intersects = ray.intersectObject(sector.planet);
       if (intersects.length > 0){
           // found first intersecting node
           $('#node-label').text(sector.planet.uri);
           
       }
       
        
    });

}

/*******************************************************************
 * General Methods
 *******************************************************************/
 
/* Retrieve the Spread activation model from the backend and create the 3D model */
function generateModel(dataset_uri, card_limit, init_A, f, d){
    
    // e.g. activate?dataset_uri=bbc.co.uk&card_limit=100&init_A=0.2&f=0.2&d=0.0001
    
    $.ajax({
       url: 'activate?dataset_uri=' + dataset_uri + '&card_limit=' + card_limit + '&init_A=' + init_A + '&f=' + f + '&d=' + d,
       dataType: 'json',
       success: function(data, textStatus, jqXHR){
                    
           // create the 3D model
           create3DModel(data);
           
           // plot the model on to the scene
           globalScene = prepareScene(globalScene);
           
           // render the scene and start the animation loop
           renderModel(globalRenderer, globalScene, globalCamera);
           animate();
       },
       error: function(jqXHR, textStatus, errorThrown){
           alert(textStatus + " " + errorThrown);
       }
    });
    
}

/* Will append a navigation link for a node from the 3D view */
function appendNavigationLink(URI, vector_location){
    
    var call = "pointCamera(" + vector_location.x + "," + vector_location.y + "," + vector_location.z + ");";
    $('#nav').append("<a class='model-link' onclick='" + call + "'>" + URI + "</a><br>");
    
}

/* Clear the navigation links for the view */
function clearNavigationLinks(){
    $('#nav').text("");
}

/*******************************************************************
 * JQuery Event Handlers
 *******************************************************************/
 
/* Will append all the HTML element event handlers */
function prepareUI(){
    
    // get the activation model and generate the 3D model from it
    $('#createModel').button().click(function(){
        generateModel($('#domainURI').val(), $('#card').val(), $('#init_A').val(), $('#f').val(), $('#d').val());
    });
    
    // reset the camera
    $('#resetView').button().click(function(){
        resetView();
    });
    
    // have the navigation menu slide away/in
    $('#nav-shoulder').click(function(){
        $('#nav').animate({
            width: "30%"
        }, 100);
    });    
    $('#nav').mouseleave(function(){
        $('#nav').animate({
            width: "0px"
        }, 100);        
    });
    
    // have the control panel slide away/in
    $('#control-panel-shoulder').click(function(){
        $('#control-panel').animate({
            height: "30%"
        }, 100);
    });    
    $('#control-panel').mouseleave(function(){
        $('#control-panel').animate({
            height: "0px"
        }, 100);        
    });
    
    // whenever the user hovers over the canvas, re-plot the highlight node and show the nodes URI
    var ch = $('#canvas-holder');
    ch.mousemove(function(){        
        //plotHighlightNode(globalScene, galaxyModel, globalCamera.position, globalControls.target);        
    });
    
    // when the user double clicks on the canvas, project a ray to determine what node they are clicking on
    ch.dblclick(function(e){
        // first get the mouses X and Y coordinates relative to the canvas
        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;
        selectNode(galaxyModel, globalCamera, mouseX, mouseY)
    });
    
    // show an "About" dialog
    $('#openAbout').button().click(function(){
            $('#about-dialog').dialog("open");
    });
    $('#about-dialog').dialog({
        autoOpen : false,
        modal : true,
        resizable: false,
        title: "About"
    });
    
    // show a "Help" dialog
    $('#openHelp').button().click(function(){
            $('#help-dialog').dialog("open");
    });
    $('#help-dialog').dialog({
        autoOpen : false,
        modal : true,
        resizable: false,
        title: "Help"
    });    
    
}

/*******************************************************************
 * Functions to run on page load.
 ********************************************************************/

$(document).ready(function(){
    
    // first construct the UI event handlers
    prepareUI(); 
    // secondly prepare the THREE.js environment
    prepare3JS();  
   
});
