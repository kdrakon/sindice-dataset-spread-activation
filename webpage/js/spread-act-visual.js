/**
 * Author: Sean Policarpio
 * Date: 12.09.2012 13:54:03
 * 
 * Purpose: This source is primarily concerned with taking a model generated from the node.js 
 * backend that contains a spreading activation of RDF analytics from Sindice.
 * 
 */
 
/********************************************************************
 * Global Variables
 *******************************************************************/
var W = 800, H = 600; // these will be overwritten by the actual size of the canvases div
var GEOMETRIC_SEGMENTS = 8;
var PLANET_DISTANCE_TO_CENTRE = 100, MOON_DISTANCE_TO_CENTRE = 15;
var MOON_EDGE_COLOR = 0xff3300, PLANET_EDGE_COLOR = 0x0000EE;
var PLANET_COLOR = 0xCC0000, MOON_COLOR = 0xCCFF00, DOMAIN_COLOR = 0x0000EE;

var globalScene, globalRenderer, globalCamera, globalControls;

/********************************************************************
 * Three.js Methods
 ********************************************************************/
 
function sqr(x) { return x*x; } 
 
/* prepare THREE.js environment */
function prepare3JS(){
    
    var ch = $('#canvas-holder');
    W = ch.width(); H = ch.height();
    
    globalRenderer = new THREE.CanvasRenderer();
    globalRenderer.setSize(W, H);
    
    globalCamera = new THREE.PerspectiveCamera(45, W/H, 0.1, 10000);
    globalCamera.position.y = 100;
    globalCamera.position.z = 250;
    
    // attach the trackballcontrols to the camera
    globalControls = new THREE.TrackballControls( globalCamera, globalRenderer.domElement );
    globalControls.target.set( 0, 0, 0 ); 
    
    var container = $('#canvas-holder'); 
    container.append(globalRenderer.domElement);
    
}
 
/* will construct and return the whole 3D model in a Three.js scene */
function create3DModel(model){
    
    // where all 3D objects will be appended
    var scene = new THREE.Scene();
    var centreOfUniverse = new THREE.Vector3( 0, 0, 0 );
    
    // create and add the domain node sphere
    var rootSphereMaterial = new THREE.MeshLambertMaterial({ color: DOMAIN_COLOR });
    var rootSphere = new THREE.Mesh( new THREE.SphereGeometry((model.nodes[model.domain])[2] * 5, GEOMETRIC_SEGMENTS, GEOMETRIC_SEGMENTS), rootSphereMaterial);
    rootSphere.position.copy(centreOfUniverse);
    scene.add(rootSphere);
    
    // create the planet nodes around the domain node
    var galaxy = {};    
    generate3DGalaxy(model, model['domain'], galaxy, PLANET_COLOR);        
    plotPlanetsInScene(galaxy, scene, centreOfUniverse, PLANET_DISTANCE_TO_CENTRE * $('#plotDistanceFactor').val(), PLANET_EDGE_COLOR);    
  
    return scene;
    
}

/* recursive function for activation model that will create the 3D node planets */
function generate3DGalaxy(model, URIIndex, galaxy, node_color){
    
    var PARENT = 0, CARD = 1, A = 2;
    var sector = 0;
    
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: node_color });    
    
    // TODO this is quadratic *tsk* *tsk*
    _.each(model.nodes, function(node, URIkey){
        
        // select only child nodes of parent (URIIndex)
        if(node[PARENT] == URIIndex){
            
            // create child planet sphere
            var planet = new THREE.Mesh( new THREE.SphereGeometry(node[A] * 10, GEOMETRIC_SEGMENTS, GEOMETRIC_SEGMENTS), sphereMaterial);
                        
            // append the planet to the array
            galaxy[sector] = { 'planet' : planet, 'uri' : URIkey, 'moons' : {} };
            
            // recursively create child planets
            generate3DGalaxy(model, URIkey, galaxy[sector].moons, MOON_COLOR);
            
            // increment to next sector
            sector++;
        }
        
    });
    
}

/* Plots the 3D generated planets in the galaxy onto the scene */
function plotPlanetsInScene(galaxy, scene, plotCentre, radius, edge_color){
    
    // compute the ring distance that the planets should be positioned around the domain
    var numOfPlanets = _.keys(galaxy).length;
    
    // first check if this galaxy (or sub-galaxy/moons) has any planets. if not, skip this iteration
    if (numOfPlanets == 0){
        return;
    }
    
    var galaxyRadius = radius;
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
        appendNavigationLink(sector.uri, currentPlotPosition);
        
        // draw an edge from the plotcentre to this planet if a color was specified
        if ($('#edges').prop("checked")){
            var line_geometry = new THREE.Geometry();
            line_geometry.vertices.push( plotCentre ); 
            line_geometry.vertices.push( new THREE.Vector3(currentPlotPosition.x, currentPlotPosition.y, currentPlotPosition.z) );
            var line = new THREE.Line( line_geometry, new THREE.LineBasicMaterial( { color: edge_color } ));
            scene.add(line);     
        }   
    
        // next, plot the moons around this planet
        plotPlanetsInScene(sector.moons, scene, new THREE.Vector3(currentPlotPosition.x, currentPlotPosition.y, currentPlotPosition.z), MOON_DISTANCE_TO_CENTRE * $('#plotDistanceFactor').val(), MOON_EDGE_COLOR);
        
        // rotate the plot position for the next sectors
        var z = plotCentre.z + (galaxyRadius * Math.cos(currentRotation));
        var x = plotCentre.x + (galaxyRadius * Math.sin(currentRotation));        
        currentPlotPosition.setX(x);
        currentPlotPosition.setZ(z);        
        
        // increment rotation for next sectors planet
        currentRotation += rotationAngle;            
        
    });
    
}

/* render a scene */
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

/*
 * Will focus the camera on a vector position given
 */
function pointCamera(x,y,z){
    globalControls.target.copy(new THREE.Vector3(x,y,z));
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
           // clear the class/property navigation menu
           $('#nav').text("");           
           // create the 3D scene
           globalScene = create3DModel(data);
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

/*******************************************************************
 * JQuery Event Handlers
 *******************************************************************/
 
/* Will append all the HTML element event handlers */
function prepareUI(){
    
    // get the activation model and generate the 3D model from it
    $('#createModel').click(function(){
        generateModel($('#domainURI').val(), $('#card').val(), $('#init_A').val(), $('#f').val(), $('#d').val());
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
