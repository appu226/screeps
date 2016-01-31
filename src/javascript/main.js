var log = {
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,
    //vvvvvvvvv
    CURRENT: 4,
    //^^^^^^^^^
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
var unimplemented = function (msg) {
    if (msg === void 0) { msg = ""; }
    throw "Missing implementation exception: " + msg;
};
//====================================================================
var Map = (function () {
    function Map(mapData_) {
        this.mapData = mapData_;
    }
    Map.prototype.containsKey = function (key) {
        return (this.mapData[key] !== undefined);
    };
    Map.prototype.keys = function () {
        var result = [];
        for (var p in this.mapData) {
            if (this.mapData[p] !== undefined)
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
        if (ret.isDefined)
            this.mapData[key] = undefined;
        return ret;
    };
    Map.emptyMap = function () {
        return new Map({});
    };
    return Map;
})();
//====================================================================
var Set = (function () {
    function Set(map_) {
        this.map = map_;
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
    Set.prototype.keys = function () {
        return this.map.keys();
    };
    Set.emptySet = function () {
        return new Set(Map.emptyMap());
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
var CBOMover = {
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
var CreepBehavior = (function () {
    function CreepBehavior(creep_, data_) {
        this.data = data_;
        this.ops = CreepBehavior.getOps(data_);
        this.creep = creep_;
    }
    CreepBehavior.prototype.work = function () {
        this.ops.work(this.creep);
    };
    CreepBehavior.getOps = function (data) {
        return CreepBehavior[data.createdType.toString()];
    };
    CreepBehavior.createCreep = function (data, spawn) {
        return CreepBehavior.getOps(data).create(spawn, data);
    };
    CreepBehavior.mover = CBOMover;
    return CreepBehavior;
})();
;
//==============================================================================
var getSpawnFromName = function (name) {
    return Game.spawns[name];
};
//==============================================================================
var createBodyTypeCosts = function () {
    var BODY_TYPE_COSTS = {};
    BODY_TYPE_COSTS[MOVE.toString()] = 50;
    BODY_TYPE_COSTS[WORK.toString()] = 100;
    BODY_TYPE_COSTS[CARRY.toString()] = 50;
    BODY_TYPE_COSTS[ATTACK.toString()] = 80;
    BODY_TYPE_COSTS[RANGED_ATTACK.toString()] = 150;
    BODY_TYPE_COSTS[HEAL.toString()] = 250;
    BODY_TYPE_COSTS[TOUGH.toString()] = 10;
    return BODY_TYPE_COSTS;
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
        Memory.bodyTypeCosts = createBodyTypeCosts();
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
    if (CreepBehavior.createCreep(nextBuild, spawn)) {
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
        (new CreepBehavior(creep, creep.memory.defaultBehavior)).work();
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
        var queueData = queue.queueData;
        queue = new Queue(queueData);
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
        assert(queue.length() == 0, "Queue should be empty.");
        assert(queue.top() == null, "Top of empty queue should return null.");
        assert(queue.pop() == null, "Pop of empty queue should return null.");
    },
    testMap: function () {
        var map = Map.emptyMap();
        assert(map.keys().length == 0, "Length of empty map should be 0.");
        assert(map.get("one").isDefined == false, "Empty map should return empty option.");
        map.set("one", 1);
        var keys = map.keys();
        assert(keys.length == 1, "Length of map should be 1 after first insert.");
        assert(keys[0] == "one", "Keys should have only the inserted key.");
        var get = map.get("one");
        assert(get.isDefined, "Lookup of inserted key should not be empty.");
        assert(get.get == 1, "Lookup of inserted key should give inserted value.");
        assert(map.get("two").isDefined == false, "Lookup of key not yet inserted should give empty option.");
        map.set("two", 2);
        keys = map.keys();
        var expectedKeys = ["one", "two"];
        keys.sort();
        expectedKeys.sort();
        assert(keys.length == expectedKeys.length && keys.length == 2, "Length of map after two insertions should be 2.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "keys[" + i + "] should match expectedKeys[" + i + "].");
        }
        get = map.get("one");
        assert(get.isDefined, "Lookup of one should not be empty.");
        assert(get.get == 1, "Lookup of one should give 1.");
        get = map.get("two");
        assert(get.isDefined, "Lookup of two should not be empty.");
        assert(get.get == 2, "Lookup of two should give inserted value.");
        assert(map.get("three").isDefined == false, "Lookup of three should not be defined.");
        map = new Map(map.mapData);
        map.set("three", 3);
        keys = map.keys();
        var expectedKeys = ["one", "two", "three"];
        keys.sort();
        expectedKeys.sort();
        assert(keys.length == expectedKeys.length && keys.length == 3, "Length of map after three insertions should be 3.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "keys[" + i + "] should match expectedKeys[" + i + "].");
        }
        get = map.get("one");
        assert(get.isDefined, "Lookup of one should not be empty.");
        assert(get.get == 1, "Lookup of one should give 1.");
        get = map.get("two");
        assert(get.isDefined, "Lookup of two should not be empty.");
        assert(get.get == 2, "Lookup of two should give inserted value.");
        get = map.get("three");
        assert(get.isDefined, "Lookup of two should not be empty.");
        assert(get.get == 3, "Lookup of two should give inserted value.");
        assert(map.get("four").isDefined == false, "Lookup of three should not be defined.");
        map.pop("two");
        keys = map.keys();
        expectedKeys = ["one", "three"];
        keys.sort();
        expectedKeys.sort();
        assert(keys.length == expectedKeys.length && keys.length == 2, "Length of map after two insertions should be 2.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "keys[" + i + "] should match expectedKeys[" + i + "].");
        }
        get = map.get("one");
        assert(get.isDefined, "Lookup of one should not be empty.");
        assert(get.get == 1, "Lookup of one should give 1.");
        get = map.get("three");
        assert(get.isDefined, "Lookup of three should not be empty.");
        assert(get.get == 3, "Lookup of three should give inserted value.");
        assert(map.get("two").isDefined == false, "Lookup of two should not be defined.");
    },
    testSet: function () {
        var set = Set.emptySet();
        var keys = set.keys();
        var expectedKeys = [];
        assert(keys.length == 0, "Length of empty set should be zero.");
        assert(set.contains("one") == false, "Empty set should not contain one");
        set.insert("one");
        keys = set.keys();
        assert(set.contains("one"), "Set with one should contain one.");
        expectedKeys = ["one"];
        assert(keys.length == 1 && keys.length == expectedKeys.length, "Set keys should have expected length.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "Keys should have expected keys.");
        }
        set = new Set(set.map);
        set.insert("two");
        keys = set.keys();
        expectedKeys = ["one", "two"];
        keys.sort();
        expectedKeys.sort();
        assert(keys.length == 2 && keys.length == expectedKeys.length, "Set keys should have expected length.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "Keys should have expected keys.");
        }
        set.remove("one");
        set.insert("two");
        keys = set.keys();
        expectedKeys = ["two"];
        keys.sort();
        expectedKeys.sort();
        assert(keys.length == 1 && keys.length == expectedKeys.length, "Set keys should have expected length.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "Keys should have expected keys.");
        }
        assert(set.contains("one") == false, "Set should not have removed key.");
        assert(set.contains("two") == true, "Set should have inserted key.");
        set.insert("one");
        set.insert("three");
        keys = set.keys();
        expectedKeys = ["one", "two", "three"];
        keys.sort();
        expectedKeys.sort();
        assert(keys.length == 3 && keys.length == expectedKeys.length, "Set keys should have expected length.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "Keys should have expected keys.");
        }
        assert(set.contains("one") == true, "Set should have re-inserted key.");
        assert(set.contains("two") == true, "Set should have inserted key.");
        assert(set.contains("three") == true, "Set should have inserted key.");
        assert(set.contains("four") == false, "Set should not have un-inserted key.");
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
            log.info("Starting " + test + "...");
            tests[test]();
            summary.push("     SUCCESS:  " + test);
            log.info(test + " passed.");
            passed = passed + 1;
        }
        catch (e) {
            var msg = "without a message.";
            if (e.message) {
                msg = "with message (" + e.message + ").";
            }
            if (e.isMyAssertion) {
                summary.push(" *** FAILURE:  " + test);
                failed = failed + 1;
                log.warn(test + " failed " + msg);
            }
            else {
                summary.push(" XXX CRASHED: " + test);
                error = error + 1;
                log.error(test + " crashed " + msg);
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
    process.exit(error + failed);
}
