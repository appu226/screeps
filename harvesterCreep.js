var myUtils = require('myUtils');
module.exports = {
  moduleType : "creep",
  creepType : "harvesterCreep",
  startConfig : [ WORK, CARRY, MOVE ],
  run : function(creep) {
    if (creep.carry.energy < creep.carryCapacity) {
      myUtils.creepHarvest(creep);
    } else {
      var spawn = Game.getObjectById(creep.memory.spawnId);
      if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
        myUtils.creepMoveStatic(creep, spawn);
    }
  }
};