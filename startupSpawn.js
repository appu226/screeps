var myUtils = require('myUtils');
module.exports = {
    moduleType : "spawn",
    spawnType : "startupSpawn",
    run : function(spawn) {
	var nextCreepIndex = myUtils.getOrSet(spawn.memory, "lastCreepIndex", 0) + 1;
	var nextCreepType = creepTypes[nextCreepIndex % creepTypes.size()];
	var nextCreepConfig = require(nextCreepType);
	var nextName = nextCreepType + Game.creeps.size();
	var startMemory = {creepType: nextCreepType};
	if (spawn.canCreateCreep(nextCreepConfig.startConfig, nextName, startMemory) == OK) {
	    spawn.createCreep(nextCreepConfig.startConfig, nextName, startMemory);
	    spawn.memory.lastCreepIndex = nextCreepIndex;
	}
    },
    creepTypes : [ "harvesterCreep", "harvesterCreep", "defenderCreep", "defenderCreep" ]

};