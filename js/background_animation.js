init();
async function init() {
    let img = new Image();
    img.src = "./img/background.jpg";
    await new Promise(r => img.onload = r);

    let depth = new Image();
    depth.src = "./img/background_depth.png";
    await new Promise(r => depth.onload = r);

    let canvas = document.createElement("canvas");
    canvas.height = img.height;
    canvas.width = img.width;

    Object.assign(canvas.style, {
        height: "100vh",
        width: "100vw",
        objectFit: "cover",
        position: "absolute",
        zIndex: "-1"
    })

    let gl = canvas.getContext("webgl");

    document.body.appendChild(canvas);

    let vertices = [-1, -1, -1, 1, 1, -1, 1, 1];

    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    let vshader = `
        attribute vec2 pos;
        varying vec2 vpos;
        void main() {
            vpos = pos*-0.5 + vec2(0.5);
            gl_Position = vec4(pos, 0.0, 1.0);
        }`

    let vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vshader);
    gl.compileShader(vs);

    let fshader = `
        precision highp float;
        uniform sampler2D img;
        uniform sampler2D depth;
        uniform vec2 mouse;
        varying vec2 vpos;
        void main() {
            float dp = -0.5 + texture2D(depth, vpos).x;
            gl_FragColor = texture2D(img, vpos + mouse * 0.2 * dp);
        }`

    let fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fshader);
    gl.compileShader(fs);

    let program = gl.createProgram();
    gl.attachShader(program, fs);
    gl.attachShader(program, vs);
    gl.linkProgram(program);
    gl.useProgram(program);

    function setTexture(im, name, num) {
        let texture = gl.createTexture();
        // gl.activeTexture(gl.TEXTURE0 + num);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.uniform1i(gl.getUniformLocation(program, name), num);
    }

    setTexture(depth, "depth", 1);
    setTexture(img, "img", 0);

    loop();

    function loop() {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(loop);
    }

    let mouseloc = gl.getUniformLocation(program, "mouse");
    onmousemove = function (d) {
        let mpos = [-0.5 + d.clientX / canvas.width, 0.5 - d.clientY / canvas.width];
        gl.uniform2fv(mouseloc, new  Float32Array(mpos));
    }
}