var c = document.querySelector("canvas");

c.width = 720;
c.height = 480;

var ctx = c.getContext("2d");

function randInt(max) {
    return Math.floor(Math.random() * max);
}

function f(x) {
    if (x > 0) return 1;
    if (x < 0) return -1;
    return 0;
}

class World {
    constructor(size) {
        this._terrain = [];
        this._lighting = [];
        var generation = [0,1,1,1,1,1,1,1,2,2,3,3,3];
        for (var i = 0; i < size; i++) {
            this._terrain.push(generation[randInt(generation.length)]);
            this._lighting.push(1);
        }
        for (var i = size / 2 - 2; i < size / 2 + 2; i++) {
            this._terrain[i] = 0;
        }
        this._terrain[size / 2] = 4;
        this._player = new Entity(this, size / 2);
        this._portals = [];
        this._zombies = [];
    }

    get terrain() { return this._terrain; }
    set terrain(value) { this._terrain = value; }
    get lighting() { return this._lighting; }
    set lighting(value) { this._lighting = value; }
    get player() { return this._player; }
    get zombies() { return this._zombies; }
    set zombies(value) { this._zombies = value; }
}

class Entity {
    constructor(nest, position) {
        this._position = position;
        this._health = 20;
        this._nest = nest;
        this._direction = 1;
        this._ticksNotMoving = 0;
        this._inventory = [0, 0];
    }

    get inventory() { return this._inventory; }
    set inventory(value) { this._inventory = value; }
    get position() { return this._position; }
    get dead() { return this._health <= 0; }
    get health() { return this._health; }
    set health(value) { this._health = value; }
    get direction() { return this._direction; }
    get ticksNotMoving() { return this._ticksNotMoving; }
    set ticksNotMoving(value) { this._ticksNotMoving = value; }

    move(distance) {
        if (this._health > 0) {
            this._position += distance;
            var block = this._nest.terrain[Math.floor(this._position)];
            if (block != 0 && block != 3 && block != 4) this._position -= distance;
            else this._ticksNotMoving = 0;
        }
        this._direction = f(distance);
    }

    damage(direction) {
        this._health--;
        if (f(direction == 1)) {
            this.move(-0.1);
            this.move(-0.1);
            this.move(-0.1);
            this.move(-0.1);
            this.move(-0.1);
        }
        else {
            this.move(0.1);
            this.move(0.1);
            this.move(0.1);
            this.move(0.1);
            this.move(0.1);
        }
    }
}

var game = new World(10000);

let keys = {};
onkeydown = onkeyup = function(e){
    e = e || window.event;
    if (keys["o"] == true) keys["o"] = false;
    else keys[e.key] = (e.type == 'keydown');
}

function fillRect(x, y, width, height, color = "black") {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function px(position, color = "black") {
    fillRect(position, 238, 1, 5, color);
}

function renderTerrain(game) {
    var colors = ["white", "gray", "gold", "red", "brown"];
    for (var i = 0; i < 720; i += 1) {
        if (game.lighting[Math.floor(game.player.position + (i / 10 - 36))] == 1) {
            px(i, colors[game.terrain[Math.floor(game.player.position + (i / 10 - 36))]]);
        }
    }
}

function renderEntities(game) {
    px(360);
    for (var i = 0; i < game.zombies.length; i++) {
        px(game.zombies[i].position * 10 - game.player.position * 10 + 360, "green");
    }
}

function renderHotbar(game) {
    ctx.fillStyle = "white";
    ctx.font = "30px sans-serif";
    ctx.fillText("HP: " + game.player.health.toString(), 10, 40);
    ctx.fillText("ST: " + game.player.inventory[0].toString(), 10, 80);
    ctx.fillText("GL: " + game.player.inventory[1].toString(), 10, 120);
}

function moveZombies(game) {
    for (var i = 0; i < game.zombies.length; i++) {
        var direction = -f(game.zombies[i].position - game.player.position);
        game.zombies[i].move(direction / 40);
        if (Math.abs(game.player.position - game.zombies[i].position) < 0.1) {
            game.player.damage(-direction);
            for (var j = 0; j < 5; j++) {
                game.zombies[i].move(-direction / 10);
            }
        }
    }
}

function attack(game) {
    for (var i = 0; i < game.zombies.length; i++) {
        if (Math.abs(game.zombies[i].position - game.player.position) < 0.5 && f(game.zombies[i].position - game.player.position) == f(game.player.direction)) {
            game.zombies[i].damage(0 - f(game.player.direction));
            break;
        }
    }
}

function mineBlock(game) {
    for (var i = 1; i <= 2; i++) {
        var block = game.terrain[Math.floor(game.player.position) + i * f(game.player.direction)];
        if (block != 3 && block != 4) {
            switch (block) {
                case 0:
                    game.player.health++;
                    if (game.player.health > 20) game.player.health = 20;
                break;
                case 1:
                    if (Math.random() < 0.2) game.player.inventory[0]++;
                break;
                case 2:
                    while (Math.random() < 0.2) { game.player.inventory[1]++; }
                break;
            }
            game.terrain[Math.floor(game.player.position) + i * f(game.player.direction)] = 0;
            break;
        }
    }
}

function placeBlock(game) {
    var block = game.terrain[Math.floor(game.player.position) + f(game.player.direction)];
    if (block != 1 && block != 2 && block != 4 && game.player.inventory[0] > 0) {
        game.terrain[Math.floor(game.player.position) + f(game.player.direction)] = 1;
        game.player.inventory[0]--;
    }
}

function loop() {
    requestAnimationFrame(loop);
    fillRect(0, 0, c.width, c.height);
    renderTerrain(game);
    renderEntities(game);
    renderHotbar(game);
    if (keys["d"]) game.player.move(0.1);
    if (keys["a"]) game.player.move(-0.1);
    if (keys["o"]) attack(game);
    if (keys["k"]) game.player.ticksNotMoving++;
    else game.player.ticksNotMoving = 0;
    if (game.player.ticksNotMoving == 100) {
        mineBlock(game);
        game.player.ticksNotMoving = 0;
    }
    if (keys["p"]) placeBlock(game);
    if (game.terrain[Math.floor(game.player.position)] == 3) game.player.health--;
    moveZombies(game);
}
loop();