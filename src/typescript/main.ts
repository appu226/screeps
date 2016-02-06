
var log = {
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,

    //vvvvvvvvv
    CURRENT: 4,
    //^^^^^^^^^

    print: function(msg: String, level: number) {
        if (level >= this.CURRENT) console.log(msg);
    },
    debug: function(msg: String) { this.print(msg, this.DEBUG); },
    info: function(msg: String) { this.print(msg, this.INFO); },
    warn: function(msg: String) { this.print(msg, this.WARN); },
    error: function(msg: String) { this.print(msg, this.ERROR); }
}

//====================================================================
var unimplemented = function(msg: String = ""): any {
    throw "Missing implementation exception: " + msg;
}

//====================================================================
class Pair<T1, T2> {
    data: PairData<T1, T2>;
    constructor(data_: PairData<T1, T2>) {
        this.data = data_;
    }
    handleEither<Ret>(f1: ((T1) => Ret), f2: ((T2) => Ret)): Ret {
        if (this.data.v1 == null) return f2(this.data.v2);
        else return (f1(this.data.v1));
    }
}

//====================================================================
interface InsertionResult<TKey, TValue> { 
    left: BTreeData<TKey, TValue>;
    mid: BTreeValueData<TKey, TValue>;
    right: BTreeData<TKey, TValue>;
}


class BTree<TKey, TValue> {
    data: BTreeData<TKey, TValue>;
    constructor(_data: BTreeData<TKey, TValue>) {
        this.data = _data;
    }
    find(key: TKey): Option<BTreeValueData<TKey, TValue>> {
        if (this.data.isEmpty)
            return { isDefined: false, get: null };
        for (var vi = 0; vi < this.data.values.length && this.data.values[vi].key <= key; ++vi) {
            if (this.data.values[vi].key == key)
                return { isDefined: true, get: this.data.values[vi] };
        }
        if (this.data.isLeaf)
            return { isDefined: false, get: null };
        assert(
            this.data.children.length > vi,
            "Non leaf BTree has " +
                this.data.values.length + " values but " +
                this.data.children.length + " children.")
            return new BTree<TKey, TValue>(this.data.children[vi]).find(key);
    }
    insertOrUpdate(key: TKey, value: TValue, priority: number): void {
        if (this.data.isEmpty) {
            this.data.isLeaf = true;
            this.data.values.push({ key: key, value: value, priority: priority });
            this.data.isEmpty = false;
            this.refreshMaxPriority();
            this.data.children = [];
        }
        var insertionResult = this.internalInsert(key, value, priority);
        if(insertionResult.isDefined) {
            var res = insertionResult.get;
            this.data.isLeaf = false;
            this.data.isRoot = true;
            this.data.isEmpty = false,
            this.data.maxPriority = Math.max( res.left.maxPriority, res.mid.priority, res.left.maxPriority ),
            this.data.values = [res.mid],
            this.data.children = [res.left, res.right]
        }
        //this.refreshMaxPriority(); // <- Shouldn't be required
    }
    internalInsert(key: TKey, value: TValue, priority: number): Option<InsertionResult<TKey, TValue>> {
        for (var vi = 0; vi < this.data.values.length && this.data.values[vi].key <= key; ++vi) {
            if (this.data.values[vi].key == key) {
                this.data.values[vi].value = value;
                this.data.values[vi].priority = priority;
                return {isDefined: false, get: null};
            }
        }
        if (this.data.isLeaf) {
            this.data.values.splice(vi, 0, { key: key, value: value, priority: priority } );
        }
        var insertionResult = 
            new BTree<TKey, TValue>(this.data.children[vi]).internalInsert(key, value, priority);
        if(insertionResult.isDefined) {
            var res = insertionResult.get;
            this.data.children.splice(vi, 1, res.left, res.right);
            this.data.values.splice(vi, 0, res.mid);
        }
        return this.splitIfRequired();
    }
    splitIfRequired(): Option<InsertionResult<TKey, TValue>>{
        if(this.data.values.length < 3)
            return { isDefined: false, get: null }
        if(this.data.values.length > 3)
            throw "BTree size should not be greater than 3, found " + this.data.values.length;
        var leftChild: BTreeData<TKey, TValue> = {
            isLeaf: this.data.isLeaf,
            isRoot: false,
            isEmpty: false,
            maxPriority: 0,
            values: [this.data.values[0]],
            children: [this.data.children[0], this.data.children[1]]
        }
        new BTree<TKey, TValue>(leftChild).refreshMaxPriority();
        var rightChild: BTreeData<TKey, TValue> = {
            isLeaf: this.data.isLeaf,
            isRoot: false,
            isEmpty: false,
            maxPriority: 0,
            values: [this.data.values[2]],
            children: [this.data.children[2], this.data.children[3]]
        }
        new BTree<TKey, TValue>(rightChild).refreshMaxPriority();
        var insertionResult: InsertionResult<TKey, TValue> = {
            left: leftChild,
            mid: this.data.values[1],
            right: rightChild
        }
        return {
            isDefined: true,
            get: insertionResult
        }
    }
    refreshMaxPriority() {
        var maxPriority = 0;
        for (var i = 0; i < this.data.values.length; ++i) {
            maxPriority = Math.max(maxPriority, this.data.values[i].priority);
        }
        for (var c = 0; c < this.data.children.length; ++c) {
            maxPriority = Math.max(maxPriority, this.data.children[c].maxPriority);
        }
        this.data.maxPriority = maxPriority;
    }
    static emptyBTree<TKey, TValue>(): BTree<TKey, TValue> {
        return new BTree<TKey, TValue>({
            isLeaf: false, isRoot: true, isEmpty: true,
            maxPriority: 0, values: [], children: []
        });
    }
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
    constructor(map_: Map<String>) {
        this.map = map_;
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
    keys(): Array<String> {
        return this.map.keys();
    }
    static emptySet(): Set {
        return new Set(Map.emptyMap<String>());
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
        return new Queue<TElement>(Queue.emptyQueueData<TElement>());
    }
}

//==============================================================================
interface CreepBehaviorOps {
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

    // Look if the position requires a road.
    var structures: Array<Structure> = creep.pos.lookFor('structure');
    var foundRoad = false;
    for (var i = 0; i < structures.length; ++i)
    if (structures[i].structureType == STRUCTURE_ROAD) foundRoad = true;
    if (!foundRoad) {
        var missingRoads: Map<number> = new Map<number>(Memory.centralMemory.missingRoads);
        var key: string = creep.pos.roomName + ":" + creep.pos.x.toString() + "," + creep.pos.y.toString();
        var prevVal = missingRoads.pop(key);
        if (prevVal.isDefined) {
            missingRoads.set(key, prevVal.get + 1);
        } else
            missingRoads.set(key, 1);
    }
};

//==============================================================================
class CBDWorker implements CreepBehaviorData {
    fromId: String;
    toId: String;
    createdType: String;
    resourceType: String;
    constructor(fromId_: String, toId_: String) {
        this.fromId = fromId_;
        this.toId = toId_;
        this.createdType = CBDWorker.className;
    }
    static className: String = "CBDMover";
};
class CBOWorker implements CreepBehaviorOps {
    create(spawn: Spawn, data: CreepBehaviorData): boolean {
        log.debug("CBMover.create");
        var cbdMover = <CBDWorker>data;
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
    };
    work(creep: Creep): void {
        log.debug("CBMover.work");
        var memory = <CBDWorker>creep.memory.defaultBehavior;
        var from = <Structure>Game.getObjectById(memory.fromId);
        var to = <Structure>Game.getObjectById(memory.toId);
        if (isAdjacent(creep.pos, to.pos) && creep.carry.energy > 0) {
            creep.transfer(to, RESOURCE_ENERGY);
        } else if (creep.carry.energy == creep.carryCapacity) {
            creep.moveTo(to.pos);
        } else if (isAdjacent(creep.pos, from.pos)) {
            this.take(creep, from);
        } else
            creep.moveTo(from.pos);
    };
    take(taker: Creep, giver: any): void {
        if (giver.owner && giver.owner.username && giver.owner.username != taker.owner.username) {
            //enemy structure, nothing to take.
            log.debug(taker.name + " cannot take from an enemy unit.")
            return;
        } else if (giver instanceof Source) {
            //energy source
            var giverSource = <Source>giver;
            log.debug(taker.name + " is harvesting from source " + giverSource.name);
            taker.harvest(<Source>giver);
        } else if (giver instanceof Creep) {
            //creep
            var giverCreep = <Creep>giver;
            log.debug(giverCreep.name + " is transferring to " + taker.name);
            giverCreep.transfer(taker, RESOURCE_ENERGY);
        } else {
            log.debug(taker.name + "")
        }
    };
    give(giver: Creep, taker: any): void {
        if (taker.owner && taker.owner.username && taker.owner.username != giver.owner.username) {
            //enemy structure, nothing to do
            return;
        } else if (taker instanceof ConstructionSite) {
            //construction site
            var takerConstructionSite = <ConstructionSite>taker;
            if (takerConstructionSite.progress < takerConstructionSite.progressTotal) {
                log.debug(giver.name + " is building " + takerConstructionSite.structureType);
                giver.build(takerConstructionSite);
            }
            else {
                log.debug(giver.name + " has finished building " + takerConstructionSite.structureType);
                return unimplemented("Idle behavior for creeps.");
            }
        } else if (taker instanceof Structure) {
            var takerStructure = <Structure>taker;
            if (takerStructure.hits < takerStructure.hitsMax - 70) {
                //structure in need of repair
                giver.repair(takerStructure);
            } else if (GameRules.canTakeEnergy(taker.structureType)) {
                //transfer to tower/spawn etc...
                giver.transfer(taker, RESOURCE_ENERGY);
            } else if (taker.structureType == STRUCTURE_CONTROLLER) {
                giver.upgradeController(<Controller>taker);
            }
        } else if (taker instanceof Spawn) {
            var takerSpawn = <Spawn>taker;
            giver.transfer(takerSpawn, RESOURCE_ENERGY);
        } else {
            log.debug(giver.name + " doesn't know what to do with target");
            return unimplemented("nothing to do with structure");
        }
    };
};

//==============================================================================
class CreepBehavior {
    data: CreepBehaviorData;
    ops: CreepBehaviorOps;
    creep: Creep;
    constructor(creep_: Creep, data_: CreepBehaviorData) {
        this.data = data_;
        this.ops = CreepBehavior.getOps(data_);
        this.creep = creep_;
    }
    work(): void {
        this.ops.work(this.creep);
    }
    static getOps(data: CreepBehaviorData): CreepBehaviorOps {
        return CreepBehavior[data.createdType.toString()];
    }
    static createCreep(data: CreepBehaviorData, spawn: Spawn): boolean {
        return CreepBehavior.getOps(data).create(spawn, data);
    }
    static mover: CreepBehaviorOps = new CBOWorker();
};

//==============================================================================
var getSpawnFromName = function(name: String): Spawn {
    return <Spawn>Game.spawns[<any>name];
}

//==============================================================================
var GameRules = {
    createBodyTypeCosts: function(): StringToNumber {
        var BODY_TYPE_COSTS = <StringToNumber>{};
        BODY_TYPE_COSTS[MOVE.toString()] = 50;
        BODY_TYPE_COSTS[WORK.toString()] = 100;
        BODY_TYPE_COSTS[CARRY.toString()] = 50;
        BODY_TYPE_COSTS[ATTACK.toString()] = 80;
        BODY_TYPE_COSTS[RANGED_ATTACK.toString()] = 150;
        BODY_TYPE_COSTS[HEAL.toString()] = 250;
        BODY_TYPE_COSTS[TOUGH.toString()] = 10;
        return BODY_TYPE_COSTS;
    },
    canTakeEnergy: function(structureType: STRUCTURE_TYPE): boolean {
        var trueTypes: Array<STRUCTURE_TYPE> = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_LINK, STRUCTURE_TOWER, STRUCTURE_STORAGE];
        for (var i = 0; i < trueTypes.length; ++i) {
            if (trueTypes[i] == structureType)
                return true;
        }
        return false;
    }
}

//==============================================================================
var centralCommand = function() {
    log.debug("centralCommand");
    if (!Memory.centralMemory) {
        Memory.centralMemory = {
            idleSpawnNames: Queue.emptyQueueData<String>(),
            ageingCreeps: Queue.emptyQueueData<String>(),
            idleCreeps: Queue.emptyQueueData<String>(),
            missingRoads: {}
        };
        log.info("Initialized Memory.centralMemory.");
        Memory.bodyTypeCosts = GameRules.createBodyTypeCosts();
    }
    var memory = Memory.centralMemory;
    var idleSpawnQueue = new Queue<String>(memory.idleSpawnNames);
    for (var i: number = 0; i < Game.gcl.level && idleSpawnQueue.length() > 0; ++i) {
        var idleSpawnName = idleSpawnQueue.pop();
        var idleSpawn = getSpawnFromName(idleSpawnName);
        var buildQueue = new Queue<CreepBehaviorData>(idleSpawn.memory.buildQueue);
        var source = idleSpawn.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        log.info("Added mover to spawn " + idleSpawnName + ".");
        buildQueue.push(new CBDWorker(source.id, idleSpawn.id));
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
    if (CreepBehavior.createCreep(nextBuild, spawn)) {
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
        (new CreepBehavior(creep, creep.memory.defaultBehavior)).work();
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
        var queue: Queue<number> = Queue.emptyQueue<number>();
        assert(queue != null, "Empty queue should not be null.");
        assert(queue.length() == 0, "Empty queue should have 0 length.");
        queue.push(1);
        assert(queue.length() == 1, "Queue length should be 1 after one push.")
        queue.push(2);
        assert(queue.length() == 2, "Queue length should be 2 after two pushes.")
        queue.push(3);

        var queueData = queue.queueData;
        queue = new Queue<number>(queueData);

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
    },

    testSet: function(): void {
        var set = Set.emptySet();
        var keys = set.keys();
        var expectedKeys: Array<String> = [];
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
        keys.sort(); expectedKeys.sort();
        assert(keys.length == 2 && keys.length == expectedKeys.length, "Set keys should have expected length.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "Keys should have expected keys.");
        }

        set.remove("one");
        set.insert("two");
        keys = set.keys();
        expectedKeys = ["two"];
        keys.sort(); expectedKeys.sort();
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
        keys.sort(); expectedKeys.sort();
        assert(keys.length == 3 && keys.length == expectedKeys.length, "Set keys should have expected length.");
        for (var i = 0; i < keys.length; ++i) {
            assert(keys[i] == expectedKeys[i], "Keys should have expected keys.");
        }
        assert(set.contains("one") == true, "Set should have re-inserted key.");
        assert(set.contains("two") == true, "Set should have inserted key.");
        assert(set.contains("three") == true, "Set should have inserted key.");
        assert(set.contains("four") == false, "Set should not have un-inserted key.");
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
            log.info("Starting " + test + "...");
            tests[test]();
            summary.push("     SUCCESS:  " + test);
            log.info(test + " passed.");
            passed = passed + 1;
        } catch (e) {
            var msg = "without a message.";
            if (e.message) {
                msg = "with message (" + e.message + ").";
            }
            if (e.isMyAssertion) {
                summary.push(" *** FAILURE:  " + test);
                failed = failed + 1;
                log.warn(test + " failed " + msg);
            } else {
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
    if (error + failed > 0) finalStatus = "FAIL";
    console.log("============================================================");
    console.log('\n', finalStatus, "(tried: " + tried + ", passed: " + passed + ", failed: " + failed + ", errors: " + error + ")");
    process.exit(error + failed);
}
