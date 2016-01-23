var myDebug = function(msg) {
  console.log(msg);
};

var MyQueue = {
  newQueue : function() {
    return {
      pushArray : [],
      popArray : []
    };
  },
  transfer : function(queue) {
    if (queue.popArray.length == 0) {
      queue.pushArray.reverse();
      queue.popArray = queue.pushArray;
      queue.pushArray = [];
    }
  },
  pop : function(queue) {
    this.transfer(queue);
    if (queue.popArray.length == 0)
      return null;
    else {
    //   myDebug("MyQueue.pop old size is " + queue.popArray.length);
      var result = queue.popArray.pop();
    //   myDebug("MyQueue.pop new size is " + queue.popArray.length);
      return result;
    }
  },
  top : function(queue) {
    this.transfer(queue);
    if (queue.popArray.length == 0)
      return null;
    else
      return queue.popArray[queue.popArray.length - 1];
  },
  push : function(queue, item) {
    queue.pushArray.push(item);
  }
};

var CSlowHarvester = {
  createBody : function(energy) {
    myDebug("CSlowHarvester.createBody");
    var body = [ MOVE, CARRY, WORK, WORK ];
    energy = energy - 300;
    while (energy >= 100) {
      body.push(WORK);
      energy = energy - 100;
    }
    body.reverse();
    return body;
  },
  minEnergy : 300,
  createMemory : function(spawn) {
    return {
      spawnId : spawn.id,
      defaultBehavior : {
        behaviorType : "Harvester",
        args : [ spawn.pos.findClosestByPath(FIND_SOURCES).id, spawn.id ]
      },
      behaviorOverride : null
    };
  }
};

var BHarvester = {
  operate : function(creep, args) {
    var fromId = args[0], toId = args[1];
    var from = Game.getObjectById(fromId);
    var to = Game.getObjectById(toId);
    if (creep.carry.energy < creep.carryCapacity) {
      if (creep.harvest(from) == ERR_NOT_IN_RANGE) {
        creep.moveTo(from);
        creep.transfer(to, RESOURCE_ENERGY);
      }
    } else if (creep.transfer(to, RESOURCE_ENERGY)) {
      creep.moveTo(to);
      creep.harvest(from);
    }
  }
};

var behaviorMap = {
  Harvester : BHarvester
};

var creepTypeMap = {
  SlowHarvester : CSlowHarvester
};

var CreepAlgos = {
  work : function(creep) {
    var behavior = creep.memory.behaviorOverride;
    if (behavior == null)
      behavior = creep.memory.defaultBehavior;
    if (behavior != null)
      behaviorMap[behavior.behaviorType].operate(creep, behavior.args);
  }
};

var SpawnAlgos = {
  initBuildQueue : function(spawn) {
    if (typeof spawn.memory.buildQueue === "undefined") {
      var newQueue = MyQueue.newQueue();
      for ( var i = 0; i < 3; ++i)
        MyQueue.push(newQueue, "SlowHarvester");
      spawn.memory.buildQueue = newQueue;
    }
    var nextToBuild = spawn.memory.nextToBuild;
    if (typeof nextToBuild !== "undefined" && nextToBuild.length > 0) {
      MyQueue.push(spawn.memory.buildQueue, spawn.memory.nextToBuild);
    }
    spawn.memory.nextToBuild = "";
  },
  createFromBuildQueue : function(spawn) {
    myDebug("SpawnAlgos.createFromBuildQueue");
    this.initBuildQueue(spawn);
    if (_.isString(this.processOrder(spawn, MyQueue
        .top(spawn.memory.buildQueue))))
      MyQueue.pop(spawn.memory.buildQueue);
  },
  pushToBuildQueue : function(spawn, order) {
    this.initBuildQueue();
    return myQueue.push(spawn.memory.buildQueue, order);
  },
  processOrder : function(spawn, order) {
    myDebug("SpawnAlgos.processOrder( " + spawn.id + ", " + order + ")");
    if (order == null) {
      return null;
    }
    var creepType = creepTypeMap[order];
    if (spawn.energy < creepType.minEnergy)
      return ERR_NOT_ENOUGH_ENERGY;
    var body = creepType.createBody(spawn.energy);
    var memory = creepType.createMemory(spawn);
    memory.creepType = order.creepType;
    for (memField in order.memory)
      memory[memField] = order.memory[memField];
    return spawn.createCreep(body, null, memory);
  }
};

module.exports.loop = function() {
  myDebug("Main");
  for ( var spawnId in Game.spawns) {
    SpawnAlgos.createFromBuildQueue(Game.spawns[spawnId]);
  }
  ;
  for ( var creepId in Game.creeps) {
    CreepAlgos.work(Game.creeps[creepId]);
  }
  ;
};