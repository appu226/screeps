var myUtils = require('myUtils');
module.exports.loop = function() {
  console.log("main.loop");
  for ( var spawnId in Game.spawns) {
    var spawn = Game.spawns[spawnId];
    var spawnType = require(myUtils
        .getOrSet(spawn.memory, 'spawnType', 'startupSpawn'));
    spawnType.run(spawn);
  }
  for ( var creepId in Game.creeps) {
    var creep = Game.creeps[creepId];
    var creepType = require(creep.memory.creepType);
    creepType.run(creep);
  }
};