function matrixMult(m1, m2) {
	// Assume m1 and m2 are 4x4 matrixMult
	var m3 = [];
	for (var i = 0; i < 4; i++) {
		for (var j = 0; j < 4; j++) {
			var currElement = 0;
			for (var k = 0; k < 4; k++) {
				currElement += m1[4 * i + k] * m2[4 * k + j];
			}
			m3.push(currElement);
		}
	}
	return m3;
}

translationMatrix = (x, y) => {
	return [
		1, 0, 0, x,
		0, 1, 0, y,
		0, 0, 1, 0,
		0, 0, 0, 1
	];
};

inverseTranslationMatrix = (x, y) => {
	return [
		1, 0, 0, -x,
		0, 1, 0, -y,
		0, 0, 1, 0,
		0, 0, 0, 1
	];
};

scaleMatrix = scale => {
	return [
		scale, 0, 0, 0,
		0, scale, 0, 0,
		0, 0, scale, 0,
		0, 0, 0, 1
	];
};

xAxisRotationMatrix = angle => { // in radians
	return [
		1, 0, 0, 0,
		0, Math.cos(angle), -Math.sin(angle), 0,
		0, Math.sin(angle), Math.cos(angle), 0,
		0, 0, 0, 1
	];
};

yAxisRotationMatrix = angle => { // in radians
	return [
		Math.cos(angle), 0, -Math.sin(angle), 0,
		0, 1, 0, 0,
		Math.sin(angle), 0, Math.cos(angle), 0,
		0, 0, 0, 1
	];
};

zAxisRotationMatrix = angle => { // in radians
	return [
		Math.cos(angle), -Math.sin(angle), 0, 0,
		Math.sin(angle), Math.cos(angle), 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];
};

currentMatrix = translationMatrix(0, 0);

// Initialize system
const canvas = document.querySelector("#mycanvas");
const gl = canvas.getContext("webgl");

if (gl === null) {
	alert("Tidak dapat menginisialisasi WebGL .-.");
}

// Buat shader
var vertCode = `
	attribute vec3 coordinates;
	uniform mat4 transformationMatrix;
	varying float colorFactor;
	void main() {
		// Z dikali negatif karena vektor Z di WebGL berlawanan
		vec4 transformedPosition = vec4(coordinates.xy, coordinates.z * -1.0, 1.0) * transformationMatrix;
		gl_Position = transformedPosition;
		colorFactor = min(max((1.0 - transformedPosition.z) / 2.0, 0.0), 1.0);
	}
`;

var vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);	
	
var fragCode = `
	precision mediump float;
	uniform vec3 userColor;
	varying float colorFactor;
	void main(void) {
		gl_FragColor = vec4(userColor * colorFactor, 1.0);
	}
`;

var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode);
gl.compileShader(fragShader);

// Buat program
var shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	console.log(gl.getProgramInfoLog(shaderProgram));
}

gl.useProgram(shaderProgram);

var vertex_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

var index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

var coord = gl.getAttribLocation(shaderProgram, "coordinates");
gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(coord);

// Pendekatannya adalah membuat 8 kubus kecil untuk membentuk rongga kubus
var width = 0.125;
var P_OUTER = 0.5; // positive in outer section
var N_OUTER = -0.5; // negative in outer section
var P_INNER = 0.5 - width;
var N_INNER = -0.5 + width;
var vertices = [];
for (var i = 0; i < 64; i++) {
	currentVertex = [];
	for (var j = 0; j < 3; j++) { // i == 0 untuk x, dst untuk y dan z, berturut-turut
		// Mengambil dua digit ke-(j + 1) dari i dalam biner dari kanan
		var code = Math.floor(i / Math.pow(2, 2 * j)) % 4
		// Untuk XY (dalam biner), X yang menandakan positif (0) atau negatif (-1), sedangkan
		// Y yang menentukan dia outer (0) atau inner (1)
		switch (code) {
			case 0:
				currentVertex.push(P_OUTER);
				break;
			case 1:
				currentVertex.push(P_INNER);
				break;
			case 2:
				currentVertex.push(N_OUTER);
				break;
			case 3:
				currentVertex.push(N_INNER);
				break;
			default:
				console.log("ERROR!!!")
		}
	}
	vertices = vertices.concat(currentVertex);
}

var indices = [];
var numPoints = 0;

function addRectangleIndices(idx1, idx2, idx3, idx4) {
	// From two triangle
	indices.push(idx1); indices.push(idx2); indices.push(idx3);
	indices.push(idx3); indices.push(idx4); indices.push(idx1);
	numPoints += 6;
}

// From outer

addRectangleIndices(0, 1, 5, 4); addRectangleIndices(1, 3, 7, 5);
addRectangleIndices(2, 6, 7, 3); addRectangleIndices(6, 14, 15, 7);
addRectangleIndices(10, 11, 15, 14); addRectangleIndices(9, 13, 15, 11);
addRectangleIndices(8, 12, 13, 9); addRectangleIndices(4, 5, 13, 12);

addRectangleIndices(0, 4, 20, 16); addRectangleIndices(4, 12, 28, 20);
addRectangleIndices(8, 24, 28, 12); addRectangleIndices(24, 56, 60, 28);
addRectangleIndices(40, 44, 60, 56); addRectangleIndices(36, 52, 60, 44);
addRectangleIndices(32, 48, 52, 36); addRectangleIndices(16, 20, 52, 48);

addRectangleIndices(0, 16, 17, 1); addRectangleIndices(16, 48, 49, 17);
addRectangleIndices(32, 33, 49, 48); addRectangleIndices(33, 35, 51, 49);
addRectangleIndices(34, 50, 51, 35); addRectangleIndices(18, 19, 51, 50);
addRectangleIndices(2, 3, 19, 18); addRectangleIndices(1, 17, 19, 3);

addRectangleIndices(2, 18, 22, 6); addRectangleIndices(18, 50, 54, 22);
addRectangleIndices(34, 38, 54, 50); addRectangleIndices(38, 46, 62, 54);
addRectangleIndices(42, 58, 62, 46); addRectangleIndices(26, 30, 62, 58);
addRectangleIndices(10, 14, 30, 26); addRectangleIndices(6, 22, 30, 14);

addRectangleIndices(8, 9, 25, 24); addRectangleIndices(9, 11, 27, 25);
addRectangleIndices(10, 26, 27, 11); addRectangleIndices(26, 58, 59, 27);
addRectangleIndices(42, 43, 59, 58); addRectangleIndices(41, 57, 59, 43);
addRectangleIndices(40, 56, 57, 41); addRectangleIndices(24, 25, 57, 56);

addRectangleIndices(32, 36, 37, 33); addRectangleIndices(36, 44, 45, 37);
addRectangleIndices(40, 41, 45, 44); addRectangleIndices(41, 43, 47, 45);
addRectangleIndices(42, 46, 47, 43); addRectangleIndices(38, 39, 47, 46);
addRectangleIndices(34, 35, 39, 38); addRectangleIndices(33, 37, 39, 35);


// From inner (for hollow effect)
addRectangleIndices(5, 7, 23, 21); addRectangleIndices(7, 15, 31, 23);
addRectangleIndices(13, 29, 31, 15); addRectangleIndices(5, 21, 29, 13);

addRectangleIndices(20, 28, 29, 21); addRectangleIndices(28, 60, 61, 29);
addRectangleIndices(52, 53, 61, 60); addRectangleIndices(20, 21, 53, 52);

addRectangleIndices(17, 49, 53, 21); addRectangleIndices(49, 51, 55, 53);
addRectangleIndices(19, 23, 55, 51); addRectangleIndices(17, 21, 23, 19);

addRectangleIndices(22, 54, 55, 23); addRectangleIndices(54, 62, 63, 55);
addRectangleIndices(30, 31, 63, 62); addRectangleIndices(22, 23, 31, 30);

addRectangleIndices(25, 27, 31, 29); addRectangleIndices(27, 59, 63, 31);
addRectangleIndices(57, 61, 63, 59); addRectangleIndices(25, 29, 61, 57);

addRectangleIndices(37, 45, 61, 53); addRectangleIndices(45, 47, 63, 61);
addRectangleIndices(39, 55, 63, 47); addRectangleIndices(37, 53, 55, 39);

// Combine
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
var coord = gl.getAttribLocation(shaderProgram, "coordinates");
gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(coord);

var translationMatrixLoc = gl.getUniformLocation(shaderProgram, "transformationMatrix");
gl.uniformMatrix4fv(translationMatrixLoc, false, new Float32Array(currentMatrix));

var colorLoc = gl.getUniformLocation(shaderProgram, "userColor");
gl.uniform3f(colorLoc, 0.0, 0.0, 0.0);

// Pass data
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);	

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);

var xPosSlider = document.getElementById("posX");
var yPosSlider = document.getElementById("posY");
var redSlider = document.getElementById("red");
var greenSlider = document.getElementById("green");
var blueSlider = document.getElementById("blue");
var scaleSlider = document.getElementById("scale");

var xPos = xPosSlider.value / 100;
var xPos = xPosSlider.value / 100;
var yPos = yPosSlider.value / 100;
var red = redSlider.value / 255;
var green = greenSlider.value / 255;
var blue = blueSlider.value / 255;
var scale = scaleSlider.value / 100;

xPosSlider.oninput = () => {
	var newXPos = xPosSlider.value / 100;
	currentMatrix = matrixMult(translationMatrix(newXPos - xPos, 0), currentMatrix);
	xPos = newXPos;
	render();
};

yPosSlider.oninput = () => {
	var newYPos = yPosSlider.value / 100;
	currentMatrix = matrixMult(translationMatrix(0, newYPos - yPos), currentMatrix);
	yPos = newYPos;
	render();
};

redSlider.oninput = () => {
	red = redSlider.value / 255;
	gl.uniform3f(colorLoc, red, green, blue);
	render();
};

greenSlider.oninput = () => {
	green = greenSlider.value / 255;
	gl.uniform3f(colorLoc, red, green, blue);
	render();
};

blueSlider.oninput = () => {
	blue = blueSlider.value / 255;
	gl.uniform3f(colorLoc, red, green, blue);
	render();
};

scaleSlider.oninput = () => {
	newScale = scaleSlider.value / 100;
	currentMatrix = matrixMult(inverseTranslationMatrix(xPos, yPos), currentMatrix)
	currentMatrix = matrixMult(scaleMatrix(newScale / scale), currentMatrix);
	currentMatrix = matrixMult(translationMatrix(xPos, yPos), currentMatrix);
	scale = newScale;
	render();
};

// Update
currentMatrix = matrixMult(scaleMatrix(scale), currentMatrix);
currentMatrix = matrixMult(translationMatrix(xPos, yPos), currentMatrix);
gl.uniform3f(colorLoc, red, green, blue);
render();

function render() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniformMatrix4fv(translationMatrixLoc, false, new Float32Array(currentMatrix));
	gl.drawElements(gl.TRIANGLES, numPoints, gl.UNSIGNED_SHORT, 0);
}

var clockwiseXAxisRotation;
var counterclockwiseXAxisRotation;

var clockwiseYAxisRotation;
var counterclockwiseYAxisRotation;

var clockwiseZAxisRotation;
var counterclockwiseZAxisRotation;
	
function startClockwiseXAxisRotation() {
	clockwiseXAxisRotation = setInterval(() => {
			currentMatrix = matrixMult(inverseTranslationMatrix(xPos, yPos), currentMatrix)
			currentMatrix = matrixMult(xAxisRotationMatrix(-5 * Math.PI / 180), currentMatrix);
			currentMatrix = matrixMult(translationMatrix(xPos, yPos), currentMatrix);
			render();
		}, 25
	);
}

function stopClockwiseXAxisRotation() {
	clearInterval(clockwiseXAxisRotation);
}

function startClockwiseYAxisRotation() {
	clockwiseYAxisRotation = setInterval(() => {
			currentMatrix = matrixMult(inverseTranslationMatrix(xPos, yPos), currentMatrix)
			currentMatrix = matrixMult(yAxisRotationMatrix(-5 * Math.PI / 180), currentMatrix);
			currentMatrix = matrixMult(translationMatrix(xPos, yPos), currentMatrix);
			render();
		}, 25
	);
}

function stopClockwiseYAxisRotation() {
	clearInterval(clockwiseYAxisRotation);
}

function startClockwiseZAxisRotation() {
	clockwiseZAxisRotation = setInterval(() => {
			currentMatrix = matrixMult(inverseTranslationMatrix(xPos, yPos), currentMatrix)
			currentMatrix = matrixMult(zAxisRotationMatrix(-5 * Math.PI / 180), currentMatrix);
			currentMatrix = matrixMult(translationMatrix(xPos, yPos), currentMatrix);
			render();
		}, 25
	);
}

function stopClockwiseZAxisRotation() {
	clearInterval(clockwiseZAxisRotation);
}

function startCounterclockwiseXAxisRotation() {
	counterclockwiseXAxisRotation = setInterval(() => {
			currentMatrix = matrixMult(inverseTranslationMatrix(xPos, yPos), currentMatrix)
			currentMatrix = matrixMult(xAxisRotationMatrix(5 * Math.PI / 180), currentMatrix);
			currentMatrix = matrixMult(translationMatrix(xPos, yPos), currentMatrix);
			render();
		}, 25
	);
}

function stopCounterclockwiseXAxisRotation() {
	clearInterval(counterclockwiseXAxisRotation);
}

function startCounterclockwiseYAxisRotation() {
	counterclockwiseYAxisRotation = setInterval(() => {
			currentMatrix = matrixMult(inverseTranslationMatrix(xPos, yPos), currentMatrix)
			currentMatrix = matrixMult(yAxisRotationMatrix(5 * Math.PI / 180), currentMatrix);
			currentMatrix = matrixMult(translationMatrix(xPos, yPos), currentMatrix);
			render();
		}, 25
	);
}

function stopCounterclockwiseYAxisRotation() {
	clearInterval(counterclockwiseYAxisRotation);
}

function startCounterclockwiseZAxisRotation() {
	counterclockwiseZAxisRotation = setInterval(() => {
			currentMatrix = matrixMult(inverseTranslationMatrix(xPos, yPos), currentMatrix)
			currentMatrix = matrixMult(zAxisRotationMatrix(5 * Math.PI / 180), currentMatrix);
			currentMatrix = matrixMult(translationMatrix(xPos, yPos), currentMatrix);
			render();
		}, 25
	);
}

function stopCounterclockwiseZAxisRotation() {
	clearInterval(counterclockwiseZAxisRotation);
}