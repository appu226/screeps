var MyDataStructures = {
  queue : function() {
    var newQueue = {
      pushArray : [],
      popArray : [],
      push : function(obj) {
        this.pushArray.push(obj);
      },
      transfer: function() {
        if (this.popArray.length == 0) {
          this.pushArray.reverse();
          this.popArray = pushArray;
          this.pushArray = [];
        }
      },
      pop : function() {
        this.transfer();
        if (this.popArray.length == 0)
          return null;
        else
          return this.popArray.pop();
      },
      top : function() {
        this.transfer();
        if (this.popArray.length == 0)
          return null;
        else
          return this.popArray[this.popArray.length - 1];
      }
    };
    return newQueue;
  }
};

var CSlowHarvester = {
    createBody: function(energy){
      var body = [MOVE,CARRY,WORK];
      energy = energy - 200;
      while(energy >= 100) {
        body.push(work);
        energy = energy - 100;
      }
      body.reverse();
      return body;
    },
    minEnergy : 200,
    createMemory: function(spawn) {
      return {
        spawnId: spawn.id, 
        defaultBehavior: {
          behaviorType : "Harvester", 
          args: [spawn.pos.findClosestByPath(FIND_SOURCES).id, spawn.id]
        },
        behaviorOverride: null
      };
    }
};

var BHarvester = {
    operate: function(creep, args) {
      var fromId = args[0], toId = args[1];
      var from = Game.getObjectById(fromId);
      var to = Game.getObjectById(toId);
      if(creep.carry.energy <= creep.carryCapacity) {
        if(creep.harvest(from) == ERR_NOT_IN_RANGE) {
          creep.moveTo(from);
          creep.transfer(to, RESOURCE_ENERGY);
        }
      } else if (creep.transfer(to, RESOURCE_ENERGY)) {
        creep.moveTo(to);
        creep.harvest(from);
      }
    }
};

var behaviorMap =
  new Map(
      [("Havester", BHarvester)]
  );

var creepTypeMap = 
  new Map(
      [("SlowHarvester", CSlowHarvester)]
  );

var CreepAlgos = {
  work: function(creep) {
    var behavior = creep.memory.behaviorOverride;
    if(behavior == null) creep.memory.defaultBehavior;
    if(behavior != null)
      behaviorMap[behavior.behaviorType].operate(creep, behavior.args);
  }  
};

var SpawnAlgos = {
  initBuildQueue : function(spawn) {
    if (typeof spawn.memory.buildQueue === "undefined")
      spawn.memory.buildQueue = MyDataStructures.queue();
  },
  createFromBuildQueue : function(spawn) {
    this.initBuildQueue();
    if( typeof processOrder(spawn, spawn.memory.buildQueue.top()) === "String" )
      spawn.memory.buildQueue.pop();
  },
  pushToBuildQueue : function(spawn, order) {
    this.initBuildQueue();
    return spawn.memory.buildQueue.push(order);
  },
  processOrder : function(spawn, order) {
    var creepType = creepMap[order.creepType];
    if(spawn.energy < creepType.minEnergy)
      return ERR_NOT_ENOUGH_ENERGY;
    var body = creepType.createBody(spawn.energy);
    var memory = creepType.createMemory(spawn);
    memory.creepType = order.creepType;
    for(memField in order.memory)
      memory[memField] = order.memory[memField];
    return spawn.createCreep(body, null, memory);
  }
};

module.exports.loop = function() {
  for(spawnId in Game.spawns) {
    SpawnAlgos.createFromBuildQueue(Game.spawns[spawnId]);
  };
  for(creepId in Game.creeps) {
    CreepAlgos.work(Game.creeps[creepId]);
  };
};