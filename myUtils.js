module.exports = {
  getOrSet : function(object, propName, defaultValue) {
    console.log("myUtils.getOrSet");
    if (propName in object) {
      return object[propName];
    } else {
      object[propName] = defaultValue;
      return defaultValue;
    }
  },
  creepMoveStatic : function(creep, pos) {
    console.log("myUtils.creepMoveStatic");
    creep.moveTo(pos, {
      reusePath : true,
      serializeMemory : 10,
      noPathFinding : false
    });
  },
  creepHarvest : function(creep) {
    console.log("myUtils.creepHarvest");
    if (!("sourceId" in creep.memory)
        || Game.getObjectById(creep.memory.sourceId).energy == 0) {
      var activeSources = creep.room.find(FIND_SOURCES_ACTIVE);
      if (activeSources.size == 0)
        return;
      creep.memory.sourceId = activeSources[0].id;
    }
    var source = Game.getObjectById(creep.memory.sourceId);
    if (creep.harvest(source) == ERR_NOT_IN_RANGE)
      require('myUtils').creepMoveStatic(creep, source);
  }
};