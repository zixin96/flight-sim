/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Zixin Zhang
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    /**
    * Set the z coords (Height) of a vertex at location(i,j)
    * @param {Object} h z coords
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setHeight(h,i,j)
    {
        //Your code here
        var locBuffer = 3 * (i * (this.div + 1) + j);
        this.vBuffer[locBuffer + 2] = h;
    }
    
    /**
    * Return the z coords (Height) of a vertex at location(i,j)
    * @param {Object} h z coords
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getHeight(h,i,j)
    {
        //Your code here
        var locBuffer = 3 * (i * (this.div + 1) + j);
        h = this.vBuffer[locBuffer + 2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        var vid = 3*(i*(this.div+1)+j);
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid + 1];
        v[2] = this.vBuffer[vid + 2];
    }
    
    /**
    * Send the buffer objects tos WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }
/**
 * Fill the vertex and buffer arrays 
 */    
generateTriangles()
{
    //Your code here
    var deltaX = (this.maxX - this.minX)/this.div;
    var deltaY = (this.maxY - this.minY)/this.div;
    
    // Populate vertex buffer and normal buffer
    for(var i = 0; i <= this.div; i++){
        for(var j = 0; j <= this.div; j++){
            this.vBuffer.push(this.minX + deltaX * j); //Start from bottom left, to the right 
            this.vBuffer.push(this.minY + deltaY * i); // i is constant, Y is constant
            this.vBuffer.push(0);
            
            this.nBuffer.push(0);
            this.nBuffer.push(0);
            this.nBuffer.push(0);

        }
    }
    
    // Populate face buffer (index into vertex buffer)
    for(var i = 0; i < this.div; i++){
        for(var j = 0; j < this.div; j++){
            var locBuffer = i * (this.div + 1) + j;
            // First triangle in a square
            this.fBuffer.push(locBuffer);
            this.fBuffer.push(locBuffer + 1);
            this.fBuffer.push(locBuffer + this.div + 1);
            
            // Second triangle in a square
            this.fBuffer.push(locBuffer + 1);
            this.fBuffer.push(locBuffer + this.div + 1 + 1);
            this.fBuffer.push(locBuffer + this.div + 1);
        }
    }
    
    //(Div + 1) is the size of the grid
    this.numVertices = this.vBuffer.length/3;
    this.numFaces = this.fBuffer.length/3;
    this.diamondSquare(this.div + 1);
    this.setNormal();
}
    
 /**
 * Return a random number between [min, max] (possibly equal)
 */   
getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}  

 /**
 * Diamond Square Algorithm 
 * @param {Float32} T_SIZE The size of the grid to generate. It must be in the form of 2^n + 1
 */
diamondSquare(T_SIZE){
    // Initial values of four corners
    var INI = 0.0;
    
    // Set the initial values of four corners
    this.setHeight(INI, 0, 0); //Uncaught TypeError: Cannot set property '2' of undefined || "vbuffer" => "vBuffer"
    this.setHeight(INI, T_SIZE - 1, 0);
    this.setHeight(INI, 0, T_SIZE - 1);
    this.setHeight(INI, T_SIZE - 1, T_SIZE - 1);
    
    
    var roughness = 0.55;
    console.log("roughness: ", roughness);
    //One outer loop changes the radius of neighborhoods
    for(var radius = T_SIZE - 1; radius >= 2.0; radius /= 2.0, roughness /= 2.13){
        var halfRadius = radius / 2;
        //Two inner loops iterate over the grid generating proper height
        
        //Diamond Step
        for(var i = 0; i < T_SIZE - 1; i += radius){
            for(var j = 0; j < T_SIZE - 1; j += radius){
                var bottomLeft = [0, 0, 0];
                this.getVertex(bottomLeft, i, j);
                
                var bottomRight = [0, 0, 0];
                this.getVertex(bottomRight, i + radius, j);
                
                var topLeft = [0, 0, 0];
                this.getVertex(topLeft, i, j + radius);
                
                var topRight = [0, 0, 0];
                this.getVertex(topRight, i + radius, j + radius);
                
                var avg = (bottomLeft[2] + bottomRight[2] + topLeft[2] + topRight[2]) / 4.0;
                
                
                this.setHeight(avg + this.getRandomArbitrary(-roughness, roughness), i + halfRadius, j + halfRadius);
                
            }
        }
        
        
        //Square Step
        for(var i = 0; i < T_SIZE - 1; i += halfRadius){
            for(var j = (i + halfRadius) % radius; j < T_SIZE - 1; j += radius){
                var temp1 = [0, 0, 0];
                this.getVertex(temp1, (i - halfRadius + T_SIZE - 1) % (T_SIZE - 1), j);
                
                var temp2 = [0, 0, 0];
                this.getVertex(temp2, (i + halfRadius) % (T_SIZE - 1), j);
                
                var temp3 = [0, 0, 0];
                this.getVertex(temp3, i, (j + halfRadius) % (T_SIZE - 1));
                
                var temp4 = [0, 0, 0];
                this.getVertex(temp4, i, (j - halfRadius + T_SIZE - 1) % (T_SIZE - 1));
                
                var avg = (temp1[2] + temp2[2] + temp3[2] + temp4[2]) / 4.0;
                
                this.setHeight(avg + this.getRandomArbitrary(-roughness, roughness), i, j)
                
                if(i == 0){
                    this.setHeight(avg, T_SIZE - 1, j);
                }
                
                if(j == 0){
                    this.setHeight(avg, i, T_SIZE - 1);
                }
                
            }
        }
        
        
        
    }
    
    
}
  
/**
 * Set the correct normal after DS algorithm
 */    
setNormal(){
    for(var i = 0; i < this.fBuffer.length; i += 3){
        var faceVertices = [];
        //j = 0,1,2
        for(var j = 0; j < 3; j++){
            var temp = [];
            //i+j = 0,1,2...3,4,5...6,7,8
            temp[0] = this.vBuffer[this.fBuffer[i + j] * 3];
            temp[1] = this.vBuffer[this.fBuffer[i + j] * 3 + 1];
            temp[2] = this.vBuffer[this.fBuffer[i + j] * 3 + 2];  
            faceVertices[j] = vec3.fromValues.apply(this, temp);
        }
        //Find per face normal 
        var v1_v0 = vec3.create();
        var v2_v0 = vec3.create();
        vec3.sub(v1_v0, faceVertices[1], faceVertices[0]);
        vec3.sub(v2_v0, faceVertices[2], faceVertices[0])
        var normalCP = vec3.create();
        vec3.cross(normalCP, v1_v0, v2_v0);
        
        for(var k = 0; k < 3; k++){
            this.nBuffer[this.fBuffer[i + j] * 3] += normalCP[0];
            this.nBuffer[this.fBuffer[i + j] * 3 + 1] += normalCP[1];
            this.nBuffer[this.fBuffer[i + j] * 3 + 2] += normalCP[2];
        }
        
    }
    
    //Finally, normals needs to be unitized 
    for(var i = 0; i < this.nBuffer.length; i += 3){
        var uni = vec3.fromValues(this.nBuffer[i], this.nBuffer[i + 1], this.nBuffer[i + 2]);
        
        vec3.normalize(uni, uni);
        
        this.nBuffer[i] = uni[0];
        this.nBuffer[i + 1] = uni[1];
        this.nBuffer[i + 2] = uni[2];
    }
    
}    
/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);
        
        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);
        
        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }
    
}
    
}
