var myUtils = require('myUtils');
module.exports.loop = function () {
    for(var spawnId in Game.spawns) {
	var spawn = Game.spawns[spawnId];
	var spawnType = require(myUtils.getOrSet(spawn, 'spawnType', 'startupSpawn'));
	spawnType.run(spawn);
    }
    for(var creepId in Game.creeps) {
	var creep = Game.creeps[creepId];
	var creepType = require(creep.creepType);
	creepType.run(creep);
    }
};