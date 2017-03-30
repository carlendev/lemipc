const getTile = (col, row, map) => map.tiles[col][row]

const load = () => [Loader.loadImage('tiles', '/assets/tiles.png'), Loader.loadImage('player', '/assets/player.png')]

Game.render = (map, players) => {
    //pos begin 0
    context.clearRect(0, 0, 700, 700)
    for (let c = 0; c < map.cols; c++) {
        for (let r = 0; r < map.rows; r++) {
            var tile = getTile(c, r, map)
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
                )
            }
        }
    }
    Object.keys(players).forEach(entity => {
        context.drawImage(
            Game[entity],
            0,
            0,
            map.tsize,
            map.tsize,
            players[entity].x * map.tsize,
            players[entity].y * map.tsize,
            map.tsize,
            map.tsize
        )
    })
}
