//
// Asset loader
//

const wesh = msg => console.log(msg)

const Loader = {
    images: {}
}

Loader.loadImage = function (key, src) {
    var img = new Image();

    var d = new Promise(function (resolve, reject) {
        img.onload = function () {
            this.images[key] = img;
            resolve(img);
        }.bind(this);

        img.onerror = () => {
            reject('Could not load image: ' + src);
        };
    }.bind(this));

    img.src = src;
    return d;
};

Loader.getImage = function (key) {
    return (key in this.images) ? this.images[key] : null;
};

//
// Keyboard handler
//

const Keyboard = {};

Keyboard.LEFT = 37;
Keyboard.RIGHT = 39;
Keyboard.UP = 38;
Keyboard.DOWN = 40;

Keyboard._keys = {};

Keyboard.listenForEvents = (keys) => {
    window.addEventListener('keydown', Keyboard._onKeyDown.bind(Keyboard));
    window.addEventListener('keyup', Keyboard._onKeyUp.bind(Keyboard));

    keys.forEach(function (key) {
        Keyboard._keys[key] = false;
    }.bind(Keyboard));
}

Keyboard._onKeyDown = (event) => {
    var keyCode = event.keyCode;
    if (keyCode in Keyboard._keys) {
        event.preventDefault();
        Keyboard._keys[keyCode] = true;
    }
};

Keyboard._onKeyUp = (event) => {
    var keyCode = event.keyCode;
    if (keyCode in Keyboard._keys) {
        event.preventDefault();
        Keyboard._keys[keyCode] = false;
    }
};

Keyboard.isDown = (keyCode) => {
    if (!keyCode in Keyboard._keys) {
        throw new Error('Keycode ' + keyCode + ' is not being listened to');
    }
    return Keyboard._keys[keyCode];
};

//
// Game object
//

const Game = {};
let map;
let context;


Game.init = () => {
    Game.tileAtlas = Loader.getImage('tiles');
};

Game.update = (delta) => {
};

Game.run = () => {
    Game._previousElapsed = 0;

    Promise.all(load()).then(function (loaded) {
        Game.init();
        this.render(map);
        window.requestAnimationFrame(Game.tick);
    }.bind(Game));
};

Game.tick = function (elapsed) {
    window.requestAnimationFrame(this.tick);

    // clear previous frame
    context.clearRect(0, 0, 512, 512);

    // compute delta time in seconds -- also cap it
    var delta = (elapsed - this._previousElapsed) / 1000.0;
    delta = Math.min(delta, 0.25); // maximum delta of 250 ms
    this._previousElapsed = elapsed;

    this.update(delta);
    this.render(map);
}.bind(Game);

// override these methods to create the demo

//
// start up function
//

const start = () => {
    axios.get('http://127.0.0.1:3030/api/map')
        .then(response => {
            map = response.data.map
            context = document.getElementById('demo').getContext('2d')
            Game.run()
        })
        .catch((error) => {
            console.log(error);
        });
};
