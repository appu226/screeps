
var log = {
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,
    CURRENT: 2,
    print: function(msg: String, level: number) {
        if (level >= this.CURRENT) console.log(msg);
    },
    debug: function(msg: String) { this.print(msg, this.DEBUG); },
    info: function(msg: String) { this.print(msg, this.INFO); },
    warn: function(msg: String) { this.print(msg, this.WARN); },
    error: function(msg: String) { this.print(msg, this.ERROR); }
}

//====================================================================
class Map<TElement>{
    mapData: any;
    constructor(mapData_: any) {
        this.mapData = mapData_;
    }
    containsKey(key: string): boolean {
        return (this.mapData[key] !== undefined);
    }
    keys(): Array<String> {
        var result: Array<String> = [];
        for (var p in this.mapData) {
            if (this.mapData[p] !== undefined)
                result.push(p);
        }
        return result;
    }
    get(key: string): Option<TElement> {
        if (this.containsKey(key)) {
            return { isDefined: true, get: <TElement>this.mapData[key] };
        } else
            return { isDefined: false, get: null };
    }
    set(key: string, value: TElement): boolean {
        if (this.containsKey(key)) {
            return false;
        } else {
            this.mapData[key] = value;
            return true;
        }
    }
    pop(key: string): Option<TElement> {
        var ret = this.get(key);
        if (ret.isDefined)
            this.mapData[key] = undefined;
        return ret;
    }

    static emptyMap<TElement>(): Map<TElement> {
        return new Map<TElement>({});
    }
}
//====================================================================
class Set {
    map: Map<String>;
    constructor(mapData: any) {
        this.map = new Map<String>(mapData);
    }
    contains(key: string): boolean {
        return this.map.containsKey(key);
    }
    insert(key: string): boolean {
        return this.map.set(key, key);
    }
    remove(key: string): boolean {
        return this.map.pop(key).isDefined;
    }
}

//====================================================================
class Queue<TElement>{
    queueData: QueueData<TElement>;
    constructor(queueData_: QueueData<TElement>) {
        this.queueData = queueData_;
    }
    push(element: TElement): void {
        this.queueData.pushArray.push(element);
    }
    private transfer(): void {
        if (this.queueData.popArray.length == 0) {
            this.queueData.popArray = this.queueData.pushArray;
            this.queueData.popArray.reverse();
            this.queueData.pushArray = [];
        }
    }
    pop(): TElement {
        this.transfer();
        if (this.queueData.popArray.length == 0)
            return null;
        else
            return this.queueData.popArray.pop();
    }
    top(): TElement {
        this.transfer();
        if (this.queueData.popArray.length == 0)
            return null;
        else
            return this.queueData.popArray[this.queueData.popArray.length - 1];
    }
    length(): number {
        return this.queueData.popArray.length + this.queueData.pushArray.length;
    }

    static emptyQueueData<TElement>(): QueueData<TElement> {
        var popArray_ = (<Array<TElement>>[]);
        var pushArray_ = (<Array<TElement>>[]);
        return { popArray: popArray_, pushArray: pushArray_ };
    }
    static emptyQueue<TElement>(): Queue<TElement> {
        return new Queue(Queue.emptyQueueData<TElement>());
    }
}

//==============================================================================
interface CreepBehavior {
    create(spawn: Spawn, data: CreepBehaviorData): boolean;
    work(creep: Creep): void;
}

//==============================================================================
interface CreepAction {
    work(creep: Creep, data: CreepActionData): void;
}
//==============================================================================
var creepActions = {
    get: function(name: String): CreepAction {
        return <CreepAction>this[<any>name];
    },
    work: function(creep: Creep, actionData: CreepActionData): void {
        this.get(actionData.createdType).work(creep, actionData);
    }
}

//==============================================================================
var isAdjacent = function(pos1: RoomPosition, pos2: RoomPosition): boolean {
    if (pos1.roomName != pos2.roomName)
        return false;
    var delX = Math.abs(pos1.x - pos2.x);
    var delY = Math.abs(pos1.y - pos2.y);
    return (delX <= 1 && delY <= 1 && delX + delY > 0);
}

//==============================================================================
var commonCreepWork = function(creep: Creep) {
    if (creep.ticksToLive == 5)
        (new Queue<String>(Memory.centralMemory.ageingCreeps)).push(creep.id);
};


//==============================================================================
class CBDMover implements CreepBehaviorData {
    fromId: String;
    toId: String;
    createdType: String;
    resourceType: String;
    constructor(fromId_: String, toId_: String) {
        this.fromId = fromId_;
        this.toId = toId_;
        this.createdType = "mover";
    }
};
var CBMover: CreepBehavior = {
    create: function(spawn: Spawn, data: CreepBehaviorData): boolean {
        log.debug("CBMover.create");
        var cbdMover = <CBDMover>data;
        var energy = spawn.energy;
        if (energy < 200) return false;
        var body = [MOVE, CARRY, WORK];
        energy = energy - 200;
        while (energy >= 100) {
            body.push(WORK);
            energy = energy - 100;
        }
        var creepMemory: CreepMemory = {
            spawnId: spawn.id,
            defaultBehavior: cbdMover,
            actionOverride: Queue.emptyQueueData<CreepActionData>()
        };
        var res = spawn.createCreep(body, null, creepMemory);
        return (typeof res !== 'number');
    },
    work: function(creep: Creep): void {
        log.debug("CBMover.work");
        var memory = <CBDMover>creep.memory.defaultBehavior;
        var from = <Structure>Game.getObjectById(memory.fromId);
        var to = <Structure>Game.getObjectById(memory.toId);
        if (isAdjacent(creep.pos, to.pos) && creep.carry.energy > 0) {
            creep.transfer(to, RESOURCE_ENERGY);
        } else if (creep.carry.energy == creep.carryCapacity) {
            creep.moveTo(to.pos);
        } else if (isAdjacent(creep.pos, from.pos)) {
            creep.harvest(<Source>from);
        } else
            creep.moveTo(from.pos);
    }
};

//==============================================================================
var creepBehaviors = {
    mover: CBMover,
    get: function(name: String): CreepBehavior {
        return <CreepBehavior>this[<any>name];
    },
    work: function(creep: Creep, behaviorData: CreepBehaviorData): void {
        this.get(behaviorData.createdType).work(creep);
    }
}
//==============================================================================
var getSpawnFromName = function(name: String): Spawn {
    return <Spawn>Game.spawns[<any>name];
}

//==============================================================================
var centralCommand = function() {
    log.debug("centralCommand");
    if (!Memory.centralMemory) {
        Memory.centralMemory = {
            idleSpawnNames: Queue.emptyQueueData<String>(),
            ageingCreeps: Queue.emptyQueueData<String>()
        };
        log.info("Initialized Memory.centralMemory.");
    }
    var memory = Memory.centralMemory;
    var idleSpawnQueue = new Queue<String>(memory.idleSpawnNames);
    for (var i: number = 0; i < Game.gcl.level && idleSpawnQueue.length() > 0; ++i) {
        var idleSpawnName = idleSpawnQueue.pop();
        var idleSpawn = getSpawnFromName(idleSpawnName);
        var buildQueue = new Queue<CreepBehaviorData>(idleSpawn.memory.buildQueue);
        var source = idleSpawn.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        log.info("Added mover to spawn " + idleSpawnName + ".");
        buildQueue.push(new CBDMover(source.id, idleSpawn.id));
    }
}

//==============================================================================
var processSpawn = function(spawn: Spawn): void {
    log.debug("processSpawn");
    if (!spawn.memory.buildQueue) {
        spawn.memory = {
            buildQueue: Queue.emptyQueueData<CreepBehaviorData>()
        };
        log.info("Initialized " + spawn.name + ".memory.");
    }
    if (spawn.spawning != null) return;
    var memory = spawn.memory;
    var buildQueue = new Queue<CreepBehaviorData>(memory.buildQueue);
    var nextBuild = buildQueue.top();
    if (nextBuild == null) {
        if (spawn.energy == spawn.energyCapacity) {
            log.info("Spawn " + spawn.name + " registered as idle.");
            (new Queue<String>(Memory.centralMemory.idleSpawnNames)).push(spawn.name);
        }
        return;
    }
    var creepBehavior = creepBehaviors.get(nextBuild.createdType);
    if (creepBehavior.create(spawn, nextBuild)) {
        log.info("Created creep in spawn " + spawn.name);
        buildQueue.pop();
    } else {
        log.warn("Failed to create creep in spawn " + spawn.name + ".");
    }
}

//==============================================================================
var processCreep = function(creep: Creep): void {
    log.debug("Processing creep " + creep.name + ".");
    commonCreepWork(creep);
    var actionOverrideQueue = new Queue<CreepActionData>(creep.memory.actionOverride);
    if (actionOverrideQueue.length() > 0) {
        log.info("Creep " + creep.name + " working on action override " +
            actionOverride.createdType + ".");
        var actionOverride = actionOverrideQueue.pop();
        creepActions.work(creep, actionOverride);
        return;
    } else {
        creepBehaviors.work(creep, creep.memory.defaultBehavior);
    }
}

//==============================================================================
module.exports.loop = function() {
    log.debug("Main");
    centralCommand();

    for (var spawnId in Game.spawns) {
        var spawn: Spawn = Game.spawns[spawnId];
        processSpawn(spawn);
    }

    for (var creepId in Game.creeps) {
        var creep: Creep = Game.creeps[creepId];
        processCreep(creep);
    }
};

//==============================================================================
var assert = function(condition: boolean, message: string): void {
    if (!condition) {
        throw { message: message, isMyAssertion: true };
    }
}

var tests = {
    testTesting: function(): void {
    },
    testQueue: function(): void {
        var queue = Queue.emptyQueue<number>();
        assert(queue != null, "Empty queue should not be null.");
        assert(queue.length() == 0, "Empty queue should have 0 length.");
        queue.push(1);
        assert(queue.length() == 1, "Queue length should be 1 after one push.")
        queue.push(2);
        assert(queue.length() == 2, "Queue length should be 2 after two pushes.")
        queue.push(3);

        var queueData = queue.queueData;
        queue = new Queue(queueData);

        assert(queue.length() == 3, "Queue length should be 3 after three pushes.")
        assert(queue.top() == 1, "First Queue top should be first push.");
        assert(queue.length() == 3, "Length should not change after top.");

        assert(queue.pop() == 1, "First Queue pop should be first push.");
        assert(queue.length() == 2, "Length should be 2 after first pop.");
        assert(queue.top() == 2, "Second Queue top should be second push.")
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
    testMap: function(): void {
        var map = Map.emptyMap<number>();
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

        map = new Map<number>(map.mapData);

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
    }
}

if (process) {
    var passed = 0;
    var tried = 0;
    var failed = 0;
    var error = 0;
    var summary: Array<String> = [];
    for (var test in tests) {
        try {
            tried = tried + 1;
            console.log("Starting", test, "...");
            tests[test]();
            summary.push("     SUCCESS:  " + test);
            console.log(test, "passed.");
            passed = passed + 1;
        } catch (e) {
            var msg = "without a message.";
            if (e.message) {
                msg = " with message (" + e.message + ").";
            }
            if (e.isMyAssertion) {
                summary.push(" *** FAILURE:  " + test);
                failed = failed + 1;
                console.log(test, "failed ", msg);
            } else {
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
    if (error + failed > 0) finalStatus = "FAIL";
    console.log("============================================================");
    console.log('\n', finalStatus, "(tried: " + tried + ", passed: " + passed + ", failed: " + failed + ", errors: " + error + ")");
    process.exit(error + failed);
}