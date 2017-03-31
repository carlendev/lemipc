const getTile = (col, row, map) => map.tiles[col][row]

const load = () => [Loader.loadImage('tiles', '/assets/tiles.png'), Loader.loadImage('player', '/assets/Soldat.png')]

Game.render = (map, players) => {
    //pos begin 0
    context.clearRect(0, 0, 700, 700)
    for (let c = 0; c < map.cols; c++) {
        for (let r = 0; r < map.rows; r++) {
            var tile = getTile(c, r, map)
            if (tile !== 0) {
                context.drawImage(
                    Game.tileAtlas,
                    (tile - 1) * map.tsize,
                    0,
                    map.tsize,
                    map.tsize,
                    c * map.tsize,
                    r * map.tsize,
                    map.tsize,
                    map.tsize
                )
            }
        }
    }
    Object.keys(players).forEach(entity => {
        context.drawImage(
            Game.player,
            0,
            0,
            map.tsize,
            map.tsize,
            players[entity].pos.x * map.tsize,
            players[entity].pos.y * map.tsize,
            map.tsize,
            map.tsize
        )
    })
}
