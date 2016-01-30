
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
        return this.mapData.containsOwnProperty(key);
    }
    keys(): Array<String> {
        var result: Array<String> = [];
        for (var p in this.mapData) {
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
        if (this.containsKey(key))
            delete this.mapData[key];
        return ret;
    }

    static emptyMap<TElement>(): Map<TElement> {
        return new Map<TElement>({});
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