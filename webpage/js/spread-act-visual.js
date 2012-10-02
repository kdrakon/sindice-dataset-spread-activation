/**
 * Author: Sean Policarpio
 * Date: 12.09.2012 13:54:03
 * 
 * Purpose: This source is primarily concerned with taking a model generated from the node.js 
 * backend that contains an spreading activation of RDF analytics from Sindice.
 * 
 */
 
/*
 * Global Variables
 */
var W = 1024, H = 600;
var GEOMETRIC_SEGMENTS = 3;
var globalScene, globalRenderer, globalCamera, controls;

function sqr(x) { return x*x; } 

/*
 * Three.js Methods
 */
 
/* prepare THREE.js environment */
function prepare3JS(){
    
    globalRenderer = new THREE.CanvasRenderer();
    globalRenderer.setSize(W, H);
    
    globalCamera = new THREE.PerspectiveCamera(45, W/H, 0.1, 1000);
    globalCamera.position.z = 250;
    
    controls = new THREE.TrackballControls( globalCamera, globalRenderer.domElement );
    controls.target.set( 0, 0, 0 );
        
    var container = $('#canvas_holder'); 
    container.append(globalRenderer.domElement);
    
}
 
/* render a scene */
function renderModel(renderer, scene, camera){
    
    // update the trackball controls movements
    controls.update();
    
    // re-render the scene
    renderer.clear();    
    renderer.render(scene, camera);
    
}
 
/* will construct and return the whole 3D model in a Three.js scene */
function create3DModel(model){
    
    // where all 3D objects will be appended
    var scene = new THREE.Scene();
    var centreOfUniverse = new THREE.Vector3( 0, 0, 0 );
    
    // create and add the domain node sphere
    var rootSphereMaterial = new THREE.MeshLambertMaterial({ color: 0x0000EE });
    var rootSphere = new THREE.Mesh( new THREE.SphereGeometry((model.nodes[model.domain])[2] * 5, GEOMETRIC_SEGMENTS, GEOMETRIC_SEGMENTS), rootSphereMaterial);
    rootSphere.position.copy(centreOfUniverse);
    scene.add(rootSphere);
    
    // create the planet nodes around the domain node
    var galaxy = {};    
    generate3DGalaxy(model, model['domain'], galaxy);        
    plotPlanetsInScene(galaxy, scene, centreOfUniverse);
    
    return scene;
    
}

/* recursive function for activation model that will create the 3D nodes and edges */
function generate3DGalaxy(model, URIIndex, galaxy){
    
    var PARENT = 0, CARD = 1, A = 2;
    var sector = 0;
    
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });    
    
    _.each(model.nodes, function(node, URIkey){
        
        // select only child nodes of parent (URIIndex)
        if(node[PARENT] == URIIndex){
            
            // create child planet sphere
            var planet = new THREE.Mesh( new THREE.SphereGeometry(node[A] * 10, GEOMETRIC_SEGMENTS, GEOMETRIC_SEGMENTS), sphereMaterial);
                        
            // append the planet to the array
            galaxy[sector] = { 'planet' : planet, 'moons' : {} };
            
            // recursively create child planets
            generate3DGalaxy(model, URIkey, galaxy[sector].moons);
            
            // increment to next sector
            sector++;
        }
        
    });
    
}

/* Plots the 3D generated planets in the galaxy onto the scene */
function plotPlanetsInScene(galaxy, scene, plotCentre){
    
    // compute the ring distance that the planets should be positioned around the domain
    var numOfPlanets = _.keys(galaxy).length;
    
    // first check if this galaxy (or sub-galaxy/moons) has any planets. if not, skip this iteration
    if (numOfPlanets == 0){
        return;
    }    
    
    var biggestSector = _.max(galaxy, function(sector){ return sector.planet.boundRadius; });
    var biggestPlanetsRadius = biggestSector.planet.boundRadius;
    var galaxyRingCircumference = biggestPlanetsRadius * numOfPlanets;
    var galaxyRadius = (galaxyRingCircumference / 2) / Math.PI;
    var rotationAngle = (360 / numOfPlanets) * (Math.PI / 180);  

    // first, set the plotting position relative to the plot centre and the above computed radius
    var currentPlotPosition = new THREE.Vector3();
    currentPlotPosition.copy(plotCentre);
    currentPlotPosition.setZ(galaxyRadius); // move towards user
    
    // for each sector (index) and subsectors (subindexes), plot the sphere planets in the scene
    _.each(galaxy, function(sector, sector_id){
       
        // NOTE: the "sector" object has a planet and moons array
        
        // first plot the moons around this planet
        plotPlanetsInScene(sector.moons, scene, currentPlotPosition);
        
        // plot the current planet
        sector.planet.position.copy(currentPlotPosition);
        scene.add(sector.planet);
        
        // move the plot position
        var z = Math.sqrt(sqr(Math.abs(currentPlotPosition.z - plotCentre.z)) + sqr(Math.abs(currentPlotPosition.x - plotCentre.x))) * Math.cos(rotationAngle);
        var x = Math.sqrt(sqr(Math.abs(currentPlotPosition.z - plotCentre.z)) + sqr(Math.abs(currentPlotPosition.x - plotCentre.x))) * Math.sin(rotationAngle);
        
        currentPlotPosition.setZ(z);
        currentPlotPosition.setX(x);
        
        rotationAngle += rotationAngle;            
        
    });
    
}

function animate(){    

    setInterval(function(){
        // TODO replace with requestanimationframe
        // render the changes
        renderModel(globalRenderer, globalScene, globalCamera);
    }, 13);
    
}


/*
 * General Methods
 */
 
/* Retrieve the Spread activation model from the backend and create the 3D model */
function generateModel(dataset_uri, card_limit, init_A, f, d){
    
    // e.g. activate?dataset_uri=bbc.co.uk&card_limit=100&init_A=0.2&f=0.2&d=0.0001
    
    $.ajax({
       url: 'activate?dataset_uri=' + dataset_uri + '&card_limit=' + card_limit + '&init_A=' + init_A + '&f=' + f + '&d=' + d,
       dataType: 'json',
       success: function(data, textStatus, jqXHR){
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

/*
 * JQuery Event Handlers
 */
 
/* Will append all the HTML element event handlers */
function prepareUI(){
    
    // get the activation model and generate the 3D model from it
    $('#createModel').click(function(){
        generateModel('bbc.co.uk', 100, 0.1, 0.1, 0.00001);
    });
    
}

/*
 * Functions to run on page load.
 */

$(document).ready(function(){
    
    // first construct the UI event handlers
    prepareUI(); 
    // secondly prepare the THREE.js environment
    prepare3JS();  
   
});
