module.exports = {
  getOrSet : function(object, propName, defaultValue) {
    if (propName in object) {
      return object[propName];
    } else {
      object[propName] = defaultValue;
      return defaultValue;
    }
  },
  creepMoveStatic : function(creep, pos) {
    creep.moveTo(pos, {
      reusePath : true,
      serializeMemory : 10,
      noPathFinding : false
    });
  },
  creepHarvest : function(creep) {
    if (!("sourceId" in creep.memory)
        || Game.getObjectById(creep.sourceId).energy == 0) {
      var activeSources = creep.room.find(FIND_SOURCES_ACTIVE);
      if (activeSources.size == 0)
        return;
      creep.memory.sourceId = activeSources[0].id;
    }
    var source = Game.getObjectById(creep.memory.sourceId);
    if (creep.harvest(source) == ERR_NOT_IN_RANGE)
      myUtils.creepMoveStatic(creep, source);
  }
};