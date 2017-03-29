const getTile = (col, row, map) => map.tiles[row * map.cols + col];

const load = () => [Loader.loadImage('tiles', '/assets/tiles.png')]

Game.render = (map) => {
    for (let c = 0; c < map.cols; c++) {
        for (let r = 0; r < map.rows; r++) {
            var tile = getTile(c, r, map);
            if (tile !== 0) { // 0 => empty tile
                    context.drawImage(
                    Game.tileAtlas, // image
                    (tile - 1) * map.tsize, // source x
                    0, // source y
                    map.tsize, // source width
                    map.tsize, // source height
                    c * map.tsize,  // target x
                    r * map.tsize, // target y
                    map.tsize, // target width
                    map.tsize // target height
                );
            }
        }
    }
};
