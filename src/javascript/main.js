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
var Set = (function () {
    function Set(mapData) {
        this.map = new Map({});
    }
    Set.prototype.contains = function (key) {
        return this.map.containsKey(key);
    };
    Set.prototype.insert = function (key) {
        return this.map.set(key, key);
    };
    Set.prototype.remove = function (key) {
        return this.map.pop(key).isDefined;
    };
    return Set;
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
//==============================================================================

var assert = function (condition, message) {
    if (!condition) {
        throw { message: message, isMyAssertion: true };
    }
};
var tests = {
    testTesting: function () {
    },
    testQueue: function () {
        var queue = Queue.emptyQueue();
        assert(queue != null, "Empty queue should not be null.");
        assert(queue.length() == 0, "Empty queue should have 0 length.");
        queue.push(1);
        assert(queue.length() == 1, "Queue length should be 1 after one push.");
        queue.push(2);
        assert(queue.length() == 2, "Queue length should be 2 after two pushes.");
        queue.push(3);
        assert(queue.length() == 3, "Queue length should be 3 after three pushes.");
        assert(queue.top() == 1, "First Queue top should be first push.");
        assert(queue.length() == 3, "Length should not change after top.");
        assert(queue.pop() == 1, "First Queue pop should be first push.");
        assert(queue.length() == 2, "Length should be 2 after first pop.");
        assert(queue.top() == 2, "Second Queue top should be second push.");
        assert(queue.length() == 2, "Length should not change after second top.");
        assert(queue.pop() == 2, "Second pop should be 2.");
        assert(queue.length() == 1, "Length after second pop should be 1.");
        assert(queue.top() == 3, "Third element should be 3.");
        queue.push(4);
        assert(queue.length() == 2, "Added one more element so length should be 2.");
        assert(queue.pop() == 3, "Third pop should be 3");
        assert(queue.top() == 4, "Fourth top should be 4.");
        queue.pop();
        assert(queue.length() == 1, "Queue should be empty.");
        assert(queue.top() == null, "Top of empty queue should return null.");
        assert(queue.pop() == null, "Pop of empty queue should return null.");
    }
};
if (process) {
    var passed = 0;
    var tried = 0;
    var failed = 0;
    var error = 0;
    var summary = [];
    for (var test in tests) {
        try {
            tried = tried + 1;
            console.log("Starting", test, "...");
            tests[test]();
            summary.push("     SUCCESS:  " + test);
            console.log(test, "passed.");
            passed = passed + 1;
        }
        catch (e) {
            var msg = "without a message.";
            if (e.message) {
                msg = " with message (" + e.message + ").";
            }
            if (e.isMyAssertion) {
                summary.push(" *** FAILURE:  " + test);
                failed = failed + 1;
                console.log(test, "failed ", msg);
            }
            else {
                summary.push(" XXX CRASHED: " + test);
                error = error + 1;
                console.log(test, "crashed", msg);
            }
        }
    }
    console.log("============================================================");
    summary.sort();
    for (var i = 0; i < summary.length; ++i) {
        console.log(summary[i]);
    }
    var finalStatus = "PASS";
    if (error + failed > 0)
        finalStatus = "FAIL";
    console.log("============================================================");
    console.log('\n', finalStatus, "(tried: " + tried + ", passed: " + passed + ", failed: " + failed + ", errors: " + error + ")");
}
