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
var W = 800, H = 600;
var globalScene, globalRenderer, globalCamera;

/*
 * Three.js Methods
 */
 
/* prepare THREE.js environment */
function prepare3JS(){
    
    globalRenderer = new THREE.CanvasRenderer();
    globalRenderer.setSize(W, H);
    
    globalCamera = new THREE.PerspectiveCamera(45, W/H, 0.1, 1000);
    globalCamera.position.z = 100;
    
    var container = $('#canvas_holder'); 
    container.append(globalRenderer.domElement);
    
}
 
/* render a scene */
function renderModel(renderer, scene, camera){
    
    //scene.add(camera);
    renderer.render(scene, camera);
    
}
 
/* will construct and return the whole 3D model in a Three.js scene */
function create3DModel(model){
    
    // where all 3D objects will be appended
    var scene = new THREE.Scene();
    
    // create and add the domain node sphere
    var rootSphereMaterial = new THREE.MeshLambertMaterial({ color: 0x0000EE });
    var rootSphere = new THREE.Mesh( new THREE.SphereGeometry((model.nodes[model.domain])[2] * 10, 32, 8), rootSphereMaterial);
    rootSphere.position = new THREE.Vector3( 0, 0, 0 );
    scene.add(rootSphere);
    
    // create the nodes and edges around the domain node at 0,0,0
    generate3DNodesAndEdges(model, model['domain'], 0, 0, 0, scene);
    
    return scene;
    
}

/* recursive function for activation model that will create the 3D nodes and edges */
function generate3DNodesAndEdges(model, URIIndex, X, Y, Z, scene){
    
    var PARENT = 0, CARD = 1, A = 2;
    var newX = X, newY = Y, newZ = Z;
    
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });    
    
    _.each(model.nodes, function(node, URIkey){
        
        // select only child nodes of parent (URIIndex)
        if(node[PARENT] == URIIndex){
            // determine X,Y,Z relative to parent node and other nodes 
            newX+=10;
            newZ-=10;
            
            // create sphere there
            var sphere = new THREE.Mesh( new THREE.SphereGeometry(node[A] * 10, 32, 8), sphereMaterial);
            sphere.position = new THREE.Vector3( newX, newY, newZ );
            
            // create edge there
            
            // append the sphere and edge to the scene
            scene.add(sphere);
            
            // recursively create child nodes
            generate3DNodesAndEdges(model, URIkey, newX, newY-10, newZ, scene);
        }
        
    });
    
}

function beginCameraRotation(){    

    setInterval(function(){
        // rotate camera
        // globalCamera.rotation = new THREE.Vector3( 0, 0, 0 );
        // move camera
        //globalCamera.position = new THREE.Vector3( globalCamera.position.x + 0.1, 0, 0 );
        globalCamera.position.x += 1;
        // render the changes
        renderModel(globalRenderer, globalScene, globalCamera);
    }, 16);
    
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
           // render the scene
           renderModel(globalRenderer, globalScene, globalCamera);
           beginCameraRotation();
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
