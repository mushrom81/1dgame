var c = document.querySelector("canvas");

c.width = 720;
c.height = 480;

var ctx = c.getContext("2d");
var genereationArray = [0,1,1,1,1,1,1,1,1,1,2,2,3,3,3];

function random(max) { return Math.floor(Math.random() * max); }

function terrain() { return genereationArray[random(genereationArray.length)]; }

class Map {
    constructor(size) {
        this._field = [];
        this._light = [];
        this._recentDirection = 1;
        this._miningDelay = 0;
        this._camera = size / 2 - 361;
        for (var i = 0; i < size; i++) {
            this._field.push(terrain());
            this._light.push(0);
        }
        for (var i = -2; i < 2; i++) {
            this._field[size / 20 + i] = 0;
            this._light[size / 20 + i] = 1;
        }
        for (var i = -10; i <= 10; i++) {
            this._light[Math.floor(this.playerPos) + i] = 1;
        }
    }
    
    get field() { return this._field; }
    get camera() { return this._camera; }
    get playerPos() { return (this._camera + 359) / 10; }
    get recentDirection() { return this._recentDirection; }
    get miningDelay() { return this._miningDelay; }
    set miningDelay(value) { this._miningDelay = value; }

    move(direction) {
        if (keys["UpDown"] <= 0) this._recentDirection = direction;
        this._camera += direction;
        if (this._field[Math.floor(this.playerPos)] == 3) console.log("owch");
        if (this._field[Math.floor(this.playerPos)] != 0 && this._field[Math.floor(this.playerPos)] != 3 ) this._camera -= direction; 
        for (var i = -10; i <= 10; i++) {
            this._light[Math.floor(this.playerPos) + i] = 1;
        }
        this._miningDelay = 0;
    }

    breakBlock() {
        this._field[Math.floor(this.playerPos) + this._recentDirection] = 0;
    }
}
let Game = new Map(10000);

function drawpx(location, color) {
    ctx.fillStyle = color;
    ctx.fillRect(location, 238, 1, 5);
}

let keys = {};
onkeydown = onkeyup = function(e){
    e = e || window.event;
    if (e.key == "ArrowUp" && e.type == "keydown" && keys["ArrowUp"] == false) keys["UpDown"] = 10;
    keys[e.key] = (e.type == "keydown");
}

function loop() {
    requestAnimationFrame(loop);
    if (keys["ArrowLeft"]) Game.move(-1);
    if (keys["ArrowRight"]) Game.move(1);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 238, c.width, 5);
    for (var i = 0; i < 720; i++) {
        var block = Math.floor((i + Game.camera) / 10);
        switch (Game.field[block]) {
            case 0: // Air  
                drawpx(i, "white"); 
            break;
            case 1: // Block
                drawpx(i, "gray");
            break;
            case 2: // Ore
                drawpx(i, "gold");
            break;
            case 3: // Lava
                drawpx(i, "red");
            break;
        }
        if (Game._light[block] == 0) {
            drawpx(i, "black");
        }
    }
    drawpx(359, "black");
    if (keys["UpDown"] > 0) {
        keys["UpDown"]--;
        var center = 359;
        for (i = 0; i < 5; i++) {
            center += Game.recentDirection;
            drawpx(center, "red");            
        }
    }
    else if (keys["ArrowUp"]) {
        Game.miningDelay++;
        if (Game.miningDelay % 50 == 0) {
            Game.breakBlock();
        }

    }
}
loop();
