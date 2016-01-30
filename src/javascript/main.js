var log = {
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,
    CURRENT: 2,
    print: function (msg, level) {
        if (level >= this.CURRENT)
            console.log(msg);
    },
    debug: function (msg) { this.print(msg, this.DEBUG); },
    info: function (msg) { this.print(msg, this.INFO); },
    warn: function (msg) { this.print(msg, this.WARN); },
    error: function (msg) { this.print(msg, this.ERROR); }
};
//====================================================================
var Map = (function () {
    function Map(mapData_) {
        this.mapData = mapData_;
    }
    Map.prototype.containsKey = function (key) {
        return this.mapData.containsOwnProperty(key);
    };
    Map.prototype.keys = function () {
        var result = [];
        for (var p in this.mapData) {
            result.push(p);
        }
        return result;
    };
    Map.prototype.get = function (key) {
        if (this.containsKey(key)) {
            return { isDefined: true, get: this.mapData[key] };
        }
        else
            return { isDefined: false, get: null };
    };
    Map.prototype.set = function (key, value) {
        if (this.containsKey(key)) {
            return false;
        }
        else {
            this.mapData[key] = value;
            return true;
        }
    };
    Map.prototype.pop = function (key) {
        var ret = this.get(key);
        if (this.containsKey(key))
            delete this.mapData[key];
        return ret;
    };
    Map.emptyMap = function () {
        return new Map({});
    };
    return Map;
})();
//====================================================================
var Queue = (function () {
    function Queue(queueData_) {
        this.queueData = queueData_;
    }
    Queue.prototype.push = function (element) {
        this.queueData.pushArray.push(element);
    };
    Queue.prototype.transfer = function () {
        if (this.queueData.popArray.length == 0) {
            this.queueData.popArray = this.queueData.pushArray;
            this.queueData.popArray.reverse();
            this.queueData.pushArray = [];
        }
    };
    Queue.prototype.pop = function () {
        this.transfer();
        if (this.queueData.popArray.length == 0)
            return null;
        else
            return this.queueData.popArray.pop();
    };
    Queue.prototype.top = function () {
        this.transfer();
        if (this.queueData.popArray.length == 0)
            return null;
        else
            return this.queueData.popArray[this.queueData.popArray.length - 1];
    };
    Queue.prototype.length = function () {
        return this.queueData.popArray.length + this.queueData.pushArray.length;
    };
    Queue.emptyQueueData = function () {
        var popArray_ = [];
        var pushArray_ = [];
        return { popArray: popArray_, pushArray: pushArray_ };
    };
    Queue.emptyQueue = function () {
        return new Queue(Queue.emptyQueueData());
    };
    return Queue;
})();
//==============================================================================
var creepActions = {
    get: function (name) {
        return this[name];
    },
    work: function (creep, actionData) {
        this.get(actionData.createdType).work(creep, actionData);
    }
};
//==============================================================================
var isAdjacent = function (pos1, pos2) {
    if (pos1.roomName != pos2.roomName)
        return false;
    var delX = Math.abs(pos1.x - pos2.x);
    var delY = Math.abs(pos1.y - pos2.y);
    return (delX <= 1 && delY <= 1 && delX + delY > 0);
};
//==============================================================================
var commonCreepWork = function (creep) {
    if (creep.ticksToLive == 5)
        (new Queue(Memory.centralMemory.ageingCreeps)).push(creep.id);
};
//==============================================================================
var CBDMover = (function () {
    function CBDMover(fromId_, toId_) {
        this.fromId = fromId_;
        this.toId = toId_;
        this.createdType = "mover";
    }
    return CBDMover;
})();
;
var CBMover = {
    create: function (spawn, data) {
        log.debug("CBMover.create");
        var cbdMover = data;
        var energy = spawn.energy;
        if (energy < 200)
            return false;
        var body = [MOVE, CARRY, WORK];
        energy = energy - 200;
        while (energy >= 100) {
            body.push(WORK);
            energy = energy - 100;
        }
        var creepMemory = {
            spawnId: spawn.id,
            defaultBehavior: cbdMover,
            actionOverride: Queue.emptyQueueData()
        };
        var res = spawn.createCreep(body, null, creepMemory);
        return (typeof res !== 'number');
    },
    work: function (creep) {
        log.debug("CBMover.work");
        var memory = creep.memory.defaultBehavior;
        var from = Game.getObjectById(memory.fromId);
        var to = Game.getObjectById(memory.toId);
        if (isAdjacent(creep.pos, to.pos) && creep.carry.energy > 0) {
            creep.transfer(to, RESOURCE_ENERGY);
        }
        else if (creep.carry.energy == creep.carryCapacity) {
            creep.moveTo(to.pos);
        }
        else if (isAdjacent(creep.pos, from.pos)) {
            creep.harvest(from);
        }
        else
            creep.moveTo(from.pos);
    }
};
//==============================================================================
var creepBehaviors = {
    mover: CBMover,
    get: function (name) {
        return this[name];
    },
    work: function (creep, behaviorData) {
        this.get(behaviorData.createdType).work(creep);
    }
};
//==============================================================================
var getSpawnFromName = function (name) {
    return Game.spawns[name];
};
//==============================================================================
var centralCommand = function () {
    log.debug("centralCommand");
    if (!Memory.centralMemory) {
        Memory.centralMemory = {
            idleSpawnNames: Queue.emptyQueueData(),
            ageingCreeps: Queue.emptyQueueData()
        };
        log.info("Initialized Memory.centralMemory.");
    }
    var memory = Memory.centralMemory;
    var idleSpawnQueue = new Queue(memory.idleSpawnNames);
    for (var i = 0; i < Game.gcl.level && idleSpawnQueue.length() > 0; ++i) {
        var idleSpawnName = idleSpawnQueue.pop();
        var idleSpawn = getSpawnFromName(idleSpawnName);
        var buildQueue = new Queue(idleSpawn.memory.buildQueue);
        var source = idleSpawn.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        log.info("Added mover to spawn " + idleSpawnName + ".");
        buildQueue.push(new CBDMover(source.id, idleSpawn.id));
    }
};
//==============================================================================
var processSpawn = function (spawn) {
    log.debug("processSpawn");
    if (!spawn.memory.buildQueue) {
        spawn.memory = {
            buildQueue: Queue.emptyQueueData()
        };
        log.info("Initialized " + spawn.name + ".memory.");
    }
    if (spawn.spawning != null)
        return;
    var memory = spawn.memory;
    var buildQueue = new Queue(memory.buildQueue);
    var nextBuild = buildQueue.top();
    if (nextBuild == null) {
        if (spawn.energy == spawn.energyCapacity) {
            log.info("Spawn " + spawn.name + " registered as idle.");
            (new Queue(Memory.centralMemory.idleSpawnNames)).push(spawn.name);
        }
        return;
    }
    var creepBehavior = creepBehaviors.get(nextBuild.createdType);
    if (creepBehavior.create(spawn, nextBuild)) {
        log.info("Created creep in spawn " + spawn.name);
        buildQueue.pop();
    }
    else {
        log.warn("Failed to create creep in spawn " + spawn.name + ".");
    }
};
//==============================================================================
var processCreep = function (creep) {
    log.debug("Processing creep " + creep.name + ".");
    commonCreepWork(creep);
    var actionOverrideQueue = new Queue(creep.memory.actionOverride);
    if (actionOverrideQueue.length() > 0) {
        log.info("Creep " + creep.name + " working on action override " +
            actionOverride.createdType + ".");
        var actionOverride = actionOverrideQueue.pop();
        creepActions.work(creep, actionOverride);
        return;
    }
    else {
        creepBehaviors.work(creep, creep.memory.defaultBehavior);
    }
};
//==============================================================================
module.exports.loop = function () {
    log.debug("Main");
    centralCommand();
    for (var spawnId in Game.spawns) {
        var spawn = Game.spawns[spawnId];
        processSpawn(spawn);
    }
    for (var creepId in Game.creeps) {
        var creep = Game.creeps[creepId];
        processCreep(creep);
    }
};
