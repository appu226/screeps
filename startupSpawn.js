var myUtils = require('myUtils');
module.exports = {
  moduleType : "spawn",
  spawnType : "startupSpawn",
  creepTypes : [ "harvesterCreep", "harvesterCreep", "defenderCreep",
      "defenderCreep" ],
  run : function(spawn) {
    console.log("startupSpawn.run");
    var nextCreepIndex = myUtils.getOrSet(spawn.memory, "lastCreepIndex", -1) + 1;
    var nextCreepType = this.creepTypes[nextCreepIndex % this.creepTypes.length];
    var nextCreepConfig = require(nextCreepType);
    var numCreeps = myUtils.getOrSet(Memory, "numCreeps", 0);
    var nextName = nextCreepType + numCreeps;
    var startMemory = {
      creepType : nextCreepType,
      spawnId: spawn.id
    };
    if (spawn
        .canCreateCreep(nextCreepConfig.startConfig, nextName, startMemory) == OK) {
      spawn.createCreep(nextCreepConfig.startConfig, nextName, startMemory);
      spawn.memory.lastCreepIndex = nextCreepIndex;
      Memory.numCreeps = Memory.numCreeps + 1;
    }
  }

};