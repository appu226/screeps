var myUtils = require('myUtils');
module.exports = {
  moduleType : "creep",
  creepType : "defenderCreep",
  startConfig : [ WORK, CARRY, MOVE ],
  findTarget : function(creep) {
    var list = creep.room.find(FIND_HOSTILE_CREEPS);
    if (list.size == 0)
      list = creep.room.find(FIND_HOSTILE_SPAWNS);
    if (list.size == 0)
      list = creep.room.find(FIND_HOSTILE_STRUCTURES);
    if (list.size == 0)
      list = creep.room.find(FIND_HOSTILE_CONSTRUCTION_SITES);
    if (list.size == 0)
      return null;
    else
      return list[0];

  },
  run : function(creep) {
    var currentTargetId = myUtil.getOrSet(creep, "targetId", null);
    if (currentTargetId == null
        || Game.getObjectById(currentTargetId).hits <= 0)
      creep.memory.targetId = findTarget(creep);
    var newTargetId = creep.memory.targetId;
    if (newTargetId == null || Game.getObjectById(newTargetId).hits <= 0)
      return;
    var newTarget = Game.getObjectById(newTargetId);
    if (creep.attack(newTarget) == ERR_NOT_IN_RANGE) {
      myUtils.creepMoveStatic(newTarget);
    }

  }
};