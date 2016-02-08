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
var Pair = (function () {
    function Pair(data_) {
        this.data = data_;
    }
    Pair.prototype.handleEither = function (f1, f2) {
        if (this.data.v1 == null)
            return f2(this.data.v2);
        else
            return (f1(this.data.v1));
    };
    return Pair;
})();
var BTree = (function () {
    function BTree(_data, _klt) {
        this.data = _data;
        this.klt = _klt;
    }
    BTree.prototype.kgt = function (l, r) { return this.klt(r, l); };
    BTree.prototype.keq = function (l, r) { return (!this.klt(l, r) && !this.klt(r, l)); };
    BTree.prototype.kleq = function (l, r) { return !this.klt(r, l); };
    BTree.prototype.kgeq = function (l, r) { return !this.klt(l, r); };
    BTree.prototype.kneq = function (l, r) { return (this.klt(l, r) || this.klt(r, l)); };
    BTree.prototype.find = function (key) {
        if (this.data.isEmpty)
            return { isDefined: false, get: null };
        for (var vi = 0; vi < this.data.values.length && this.kleq(this.data.values[vi].key, key); ++vi) {
            if (this.keq(this.data.values[vi].key, key))
                return { isDefined: true, get: this.data.values[vi] };
        }
        if (this.data.isLeaf)
            return { isDefined: false, get: null };
        assert(this.data.children.length > vi, "Non leaf BTree has " +
            this.data.values.length + " values but " +
            this.data.children.length + " children.");
        return new BTree(this.data.children[vi], this.klt).find(key);
    };
    BTree.prototype.insertOrUpdate = function (key, value, priority) {
        if (this.data.isEmpty) {
            this.data.isLeaf = true;
            this.data.values.push({ key: key, value: value, priority: priority });
            this.data.isEmpty = false;
            this.data.children = [];
            BTree.refreshDerivedProperties(this.data);
        }
        var insertionResult = this.internalInsert(key, value, priority);
        if (insertionResult.isDefined) {
            var res = insertionResult.get;
            this.data.isLeaf = false;
            this.data.isRoot = true;
            this.data.isEmpty = false,
                this.data.maxPriority = Math.max(res.left.maxPriority, res.mid.priority, res.left.maxPriority),
                this.data.values = [res.mid],
                this.data.children = [res.left, res.right];
        }
        BTree.refreshDerivedProperties(this.data); // <- Shouldn't be required
    };
    BTree.prototype.internalInsert = function (key, value, priority) {
        for (var vi = 0; vi < this.data.values.length && this.kleq(this.data.values[vi].key, key); ++vi) {
            if (this.keq(this.data.values[vi].key, key)) {
                this.data.values[vi].value = value;
                this.data.values[vi].priority = priority;
                BTree.refreshDerivedProperties(this.data);
                return { isDefined: false, get: null };
            }
        }
        if (this.data.isLeaf) {
            this.data.values.splice(vi, 0, { key: key, value: value, priority: priority });
        }
        else {
            var insertionResult = new BTree(this.data.children[vi], this.klt).internalInsert(key, value, priority);
            if (insertionResult.isDefined) {
                var res = insertionResult.get;
                this.data.children.splice(vi, 1, res.left, res.right);
                this.data.values.splice(vi, 0, res.mid);
            }
        }
        BTree.refreshDerivedProperties(this.data);
        return this.splitIfRequired();
    };
    BTree.prototype.splitIfRequired = function () {
        if (this.data.values.length < 3)
            return { isDefined: false, get: null };
        assert(this.data.values.length <= 5, "BTree size should not be greater than 5, found " + this.data.values.length);
        var midValueIndex = Math.floor(this.data.values.length / 2);
        var leftChild = {
            isLeaf: this.data.isLeaf,
            isRoot: false,
            isEmpty: false,
            size: 0,
            maxPriority: 0,
            values: this.data.values.slice(0, midValueIndex),
            children: this.data.children.slice(0, midValueIndex + 1)
        };
        BTree.refreshDerivedProperties(leftChild);
        var rightChild = {
            isLeaf: this.data.isLeaf,
            isRoot: false,
            isEmpty: false,
            size: 0,
            maxPriority: 0,
            values: this.data.values.slice(midValueIndex + 1),
            children: this.data.children.slice(midValueIndex + 1)
        };
        BTree.refreshDerivedProperties(rightChild);
        var insertionResult = {
            left: leftChild,
            mid: this.data.values[midValueIndex],
            right: rightChild
        };
        return {
            isDefined: true,
            get: insertionResult
        };
    };
    BTree.prototype.remove = function (key) {
        var internalRemoveResult = this.internalRemove(key);
        assert(!internalRemoveResult.balancingResult.isDefined, "Root node should not require rebalancing");
        return internalRemoveResult.deletedValue;
    };
    BTree.prototype.internalRemove = function (key) {
        if (this.data.isRoot && this.data.isLeaf) {
            for (var i = 0; i < this.data.values.length; ++i) {
                if (this.keq(this.data.values[i].key, key)) {
                    var deletedValue = { isDefined: true, get: this.data.values[i] };
                    this.data.values.splice(i, 1);
                    this.data.isEmpty = (this.data.values.length == 0);
                    BTree.refreshDerivedProperties(this.data);
                    return {
                        deletedValue: deletedValue,
                        balancingResult: { isDefined: false, get: null }
                    };
                }
            }
            return {
                deletedValue: { isDefined: false, get: null },
                balancingResult: { isDefined: false, get: null }
            };
        }
        if (this.data.isLeaf) {
            assert(this.data.values.length > 1, "Non-root leaf should have more than one element (found: " + this.data.values.length + ")");
            var deletedValue = { isDefined: false, get: null };
            for (var i = 0; i < this.data.values.length; ++i) {
                if (this.keq(this.data.values[i].key, key)) {
                    deletedValue = { isDefined: true, get: this.data.values[i] };
                    this.data.values.splice(i, 1);
                    BTree.refreshDerivedProperties(this.data);
                }
            }
            return {
                deletedValue: deletedValue,
                balancingResult: this.splitIfRequired()
            };
        }
        var demotedIndex;
        for (demotedIndex = 0; demotedIndex < this.data.values.length - 1 && this.klt(this.data.values[demotedIndex].key, key); ++demotedIndex) {
        }
        var demotedValue = this.data.values[demotedIndex];
        var left = this.data.children[demotedIndex];
        var right = this.data.children[demotedIndex + 1];
        var mergedValues = left.values.concat(demotedValue).concat(right.values);
        var mergedChildren = left.children.concat(right.children);
        var mergedChild = {
            isLeaf: left.isLeaf,
            isRoot: false,
            isEmpty: false,
            size: 0,
            maxPriority: Math.max(left.maxPriority, right.maxPriority, demotedValue.priority),
            values: mergedValues,
            children: mergedChildren
        };
        BTree.refreshDerivedProperties(mergedChild);
        this.data.values.splice(demotedIndex, 1);
        this.data.children.splice(demotedIndex, 2, mergedChild);
        BTree.refreshDerivedProperties(this.data); // <- should not be needed
        var removeResult = new BTree(mergedChild, this.klt).internalRemove(key);
        if (removeResult.balancingResult.isDefined) {
            var br = removeResult.balancingResult.get;
            this.data.values.splice(demotedIndex, 0, br.mid);
            this.data.children.splice(demotedIndex, 1, br.left, br.right);
            BTree.refreshDerivedProperties(this.data);
        }
        if (this.data.values.length == 0) {
            assert(this.data.children.length == 1, "Node with no values should have exactly 1 child, found " + this.data.children.length);
            var child = this.data.children[0];
            this.data.isLeaf = child.isLeaf;
            this.data.isEmpty = child.isEmpty;
            this.data.maxPriority = child.maxPriority;
            this.data.values = child.values;
            this.data.children = child.children;
        }
        if (this.data.values.length == 0)
            this.data.isEmpty = false;
        BTree.refreshDerivedProperties(this.data); // <- should not be needed
        return {
            deletedValue: removeResult.deletedValue,
            balancingResult: this.splitIfRequired()
        };
    };
    BTree.prototype.findMaxPriority = function () {
        return BTree.findMaxPriority(this.data);
    };
    BTree.prototype.popMaxPriority = function () {
        var res = this.findMaxPriority();
        if (res.isDefined)
            this.remove(res.get.key);
        return res;
    };
    BTree.prototype.length = function () {
        return this.data.size;
    };
    BTree.prototype.toString = function () {
        return JSON.stringify(this.data);
    };
    BTree.prototype.prettyPrint = function () {
        console.log();
        BTree.prettyPrint([this.data]);
        console.log();
    };
    BTree.prototype.isEmpty = function () {
        return this.data.isEmpty;
    };
    BTree.prototype.isWellFormed = function () {
        return this.data.isRoot && BTree.isWellFormed(this.data, this.klt);
    };
    BTree.findMaxPriority = function (data) {
        var mp = data.maxPriority;
        for (var vi = 0; vi < data.values.length; ++vi) {
            if (data.values[vi].priority == mp) {
                return {
                    isDefined: true,
                    get: data.values[vi]
                };
            }
        }
        for (var ci = 0; ci < data.children.length; ++ci) {
            if (data.children[ci].maxPriority == mp) {
                return BTree.findMaxPriority(data.children[ci]);
            }
        }
        return {
            isDefined: false,
            get: null
        };
    };
    BTree.refreshDerivedProperties = function (data) {
        var maxPriority;
        if (data.values.length > 0)
            maxPriority = data.values[0].priority;
        else if (data.children.length > 0)
            maxPriority = data.children[0].maxPriority;
        else {
            data.maxPriority = 0;
            data.size = 0;
            return;
        }
        var size = data.values.length;
        for (var i = 0; i < data.values.length; ++i) {
            maxPriority = Math.max(maxPriority, data.values[i].priority);
        }
        for (var c = 0; c < data.children.length; ++c) {
            maxPriority = Math.max(maxPriority, data.children[c].maxPriority);
            size += data.children[c].size;
        }
        data.maxPriority = maxPriority;
        data.size = size;
    };
    BTree.prettyPrint = function (dataArray) {
        var nextLevel = [];
        var thisLevel = [];
        for (var di = 0; di < dataArray.length; ++di) {
            var data = dataArray[di];
            for (var ci = 0; ci < data.children.length; ++ci) {
                nextLevel.push(data.children[ci]);
            }
            var dataKeys = [];
            for (var vi = 0; vi < data.values.length; ++vi) {
                dataKeys.push(data.values[vi].key.toString());
            }
            thisLevel.push("(" + dataKeys.join(",") + ")");
        }
        console.log(thisLevel.join("  "));
        if (nextLevel.length > 0)
            BTree.prettyPrint(nextLevel);
    };
    BTree.isWellFormed = function (data, klt) {
        if (data.isEmpty)
            return (data.values.length == 0 && data.children.length == 0 && data.size == 0);
        if (data.isLeaf != (data.children.length == 0))
            return false;
        if (!data.isLeaf && (data.children.length != data.values.length + 1))
            return false;
        if (data.values.length < 1 || data.values.length > 2)
            return false;
        for (var i = 0; i < data.values.length; ++i) {
            if (i < data.values.length - 1 && !klt(data.values[i].key, data.values[i + 1].key))
                return false;
            if (!data.isLeaf) {
                var currKey = data.values[i].key;
                var lastPrevChild = data.children[i].values[data.children[i].values.length - 1];
                if (!klt(lastPrevChild.key, currKey))
                    return false;
                var firstNextChild = data.children[i + 1].values[0];
                if (!klt(currKey, firstNextChild.key))
                    return false;
            }
        }
        var p = data.maxPriority - 1;
        var s = data.values.length;
        for (var i = 0; i < data.values.length; ++i)
            p = Math.max(p, data.values[i].priority);
        for (var i = 0; i < data.children.length; ++i) {
            p = Math.max(p, data.children[i].maxPriority);
            s += data.children[i].size;
            if (!BTree.isWellFormed(data.children[i], klt)) {
                console.log(JSON.stringify(data.children[i]));
                return false;
            }
        }
        if (p != data.maxPriority)
            return false;
        if (s != data.size)
            return false;
        return true;
    };
    BTree.emptyBTree = function (klt) {
        return new BTree({
            isLeaf: false, isRoot: true, isEmpty: true, size: 0,
            maxPriority: 0, values: [], children: []
        }, klt);
    };
    return BTree;
})();
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
    // Look if the position requires a road.
    var structures = creep.pos.lookFor('structure');
    var foundRoad = false;
    for (var i = 0; i < structures.length; ++i)
        if (structures[i].structureType == STRUCTURE_ROAD)
            foundRoad = true;
    if (!foundRoad) {
        var missingRoads = new Map(Memory.centralMemory.missingRoads);
        var key = creep.pos.roomName + ":" + creep.pos.x.toString() + "," + creep.pos.y.toString();
        var prevVal = missingRoads.pop(key);
        if (prevVal.isDefined) {
            missingRoads.set(key, prevVal.get + 1);
        }
        else
            missingRoads.set(key, 1);
    }
};
//==============================================================================
var CBDWorker = (function () {
    function CBDWorker(fromId_, toId_) {
        this.fromId = fromId_;
        this.toId = toId_;
        this.createdType = CBDWorker.className;
    }
    CBDWorker.className = "CBDMover";
    return CBDWorker;
})();
;
var CBOWorker = (function () {
    function CBOWorker() {
    }
    CBOWorker.prototype.create = function (spawn, data) {
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
    };
    ;
    CBOWorker.prototype.work = function (creep) {
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
            this.take(creep, from);
        }
        else
            creep.moveTo(from.pos);
    };
    ;
    CBOWorker.prototype.take = function (taker, giver) {
        if (giver.owner && giver.owner.username && giver.owner.username != taker.owner.username) {
            //enemy structure, nothing to take.
            log.debug(taker.name + " cannot take from an enemy unit.");
            return;
        }
        else if (giver instanceof Source) {
            //energy source
            var giverSource = giver;
            log.debug(taker.name + " is harvesting from source " + giverSource.name);
            taker.harvest(giver);
        }
        else if (giver instanceof Creep) {
            //creep
            var giverCreep = giver;
            log.debug(giverCreep.name + " is transferring to " + taker.name);
            giverCreep.transfer(taker, RESOURCE_ENERGY);
        }
        else {
            log.debug(taker.name + "");
        }
    };
    ;
    CBOWorker.prototype.give = function (giver, taker) {
        if (taker.owner && taker.owner.username && taker.owner.username != giver.owner.username) {
            //enemy structure, nothing to do
            return;
        }
        else if (taker instanceof ConstructionSite) {
            //construction site
            var takerConstructionSite = taker;
            if (takerConstructionSite.progress < takerConstructionSite.progressTotal) {
                log.debug(giver.name + " is building " + takerConstructionSite.structureType);
                giver.build(takerConstructionSite);
            }
            else {
                log.debug(giver.name + " has finished building " + takerConstructionSite.structureType);
                return unimplemented("Idle behavior for creeps.");
            }
        }
        else if (taker instanceof Structure) {
            var takerStructure = taker;
            if (takerStructure.hits < takerStructure.hitsMax - 70) {
                //structure in need of repair
                giver.repair(takerStructure);
            }
            else if (GameRules.canTakeEnergy(taker.structureType)) {
                //transfer to tower/spawn etc...
                giver.transfer(taker, RESOURCE_ENERGY);
            }
            else if (taker.structureType == STRUCTURE_CONTROLLER) {
                giver.upgradeController(taker);
            }
        }
        else if (taker instanceof Spawn) {
            var takerSpawn = taker;
            giver.transfer(takerSpawn, RESOURCE_ENERGY);
        }
        else {
            log.debug(giver.name + " doesn't know what to do with target");
            return unimplemented("nothing to do with structure");
        }
    };
    ;
    return CBOWorker;
})();
;
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
    CreepBehavior.mover = new CBOWorker();
    return CreepBehavior;
})();
;
//==============================================================================
var getSpawnFromName = function (name) {
    return Game.spawns[name];
};
//==============================================================================
var GameRules = {
    createBodyTypeCosts: function () {
        var BODY_TYPE_COSTS = {};
        BODY_TYPE_COSTS[MOVE.toString()] = 50;
        BODY_TYPE_COSTS[WORK.toString()] = 100;
        BODY_TYPE_COSTS[CARRY.toString()] = 50;
        BODY_TYPE_COSTS[ATTACK.toString()] = 80;
        BODY_TYPE_COSTS[RANGED_ATTACK.toString()] = 150;
        BODY_TYPE_COSTS[HEAL.toString()] = 250;
        BODY_TYPE_COSTS[TOUGH.toString()] = 10;
        return BODY_TYPE_COSTS;
    },
    canTakeEnergy: function (structureType) {
        var trueTypes = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_LINK, STRUCTURE_TOWER, STRUCTURE_STORAGE];
        for (var i = 0; i < trueTypes.length; ++i) {
            if (trueTypes[i] == structureType)
                return true;
        }
        return false;
    }
};
//==============================================================================
var centralCommand = function () {
    log.debug("centralCommand");
    if (!Memory.centralMemory) {
        Memory.centralMemory = {
            idleSpawnNames: Queue.emptyQueueData(),
            ageingCreeps: Queue.emptyQueueData(),
            idleCreeps: Queue.emptyQueueData(),
            missingRoads: {}
        };
        log.info("Initialized Memory.centralMemory.");
        Memory.bodyTypeCosts = GameRules.createBodyTypeCosts();
    }
    var memory = Memory.centralMemory;
    var idleSpawnQueue = new Queue(memory.idleSpawnNames);
    for (var i = 0; i < Game.gcl.level && idleSpawnQueue.length() > 0; ++i) {
        var idleSpawnName = idleSpawnQueue.pop();
        var idleSpawn = getSpawnFromName(idleSpawnName);
        var buildQueue = new Queue(idleSpawn.memory.buildQueue);
        var source = idleSpawn.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        log.info("Added mover to spawn " + idleSpawnName + ".");
        buildQueue.push(new CBDWorker(source.id, idleSpawn.id));
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
    },
    testBTree: function () {
        var lt = function (l, r) {
            return parseInt(l.valueOf()) < parseInt(r.valueOf());
        };
        var maxPriority = function (pStore) {
            var max = 0;
            for (var i = 0; i < pStore.length; ++i) {
                max = Math.max(max, pStore[i]);
            }
            return max;
        };
        var priority = function (j) {
            return j * (15 - j);
        };
        var btree = BTree.emptyBTree(lt);
        var priorities = [];
        assert(btree.isEmpty(), "Empty btree should have isEmpty set to true");
        assert(btree.isWellFormed(), "Empty btree should be well formed.");
        for (var i = 0; i < 20; ++i) {
            btree.insertOrUpdate(i.toString(), i, priority(i));
            priorities.push(priority(i));
            assert(btree.findMaxPriority().isDefined, "Max priority element should exist");
            assert(btree.findMaxPriority().get.priority == maxPriority(priorities), "Incorrect max priority");
            assert(!btree.isEmpty(), "Btree with " + i + " elements should not have isEmpty");
            assert(btree.isWellFormed(), "BTree with " + i + " elements should be well formed");
            for (var j = -5; j < 15; ++j) {
                var findResult = btree.find(j.toString());
                assert(findResult.isDefined == (j >= 0 && j <= i), j + " should not be found after inserting [0, " + i + "].");
                if (findResult.isDefined) {
                    assert(findResult.get.key == j.toString(), "Found key should be searched key");
                    assert(findResult.get.value == j, "Found value should be correct");
                    assert(findResult.get.priority == priority(j), "Found priority should be correct");
                }
            }
        }
        btree = new BTree(JSON.parse(JSON.stringify(btree.data)), lt);
        for (var i = 4; i < 40; i += 4) {
            var removedResult = btree.remove(i.toString());
            assert(removedResult.isDefined == (i < 20), "Removal should succeed only for inserted keys.");
            if (removedResult.isDefined) {
                assert(removedResult.get.key == i.toString(), "Removed key should be correct");
                assert(removedResult.get.value == i, "Removed value should be correct");
                assert(removedResult.get.priority == priority(i), "Removed priority should be correct");
                priorities[i] = -5000000;
                assert(btree.findMaxPriority().isDefined, "Max priority element should exist");
                assert(btree.findMaxPriority().get.priority == maxPriority(priorities), "Incorrect max priority");
            }
            assert(!btree.isEmpty(), "BTree should not be empty untill everything is removed.");
            assert(btree.isWellFormed(), "BTree should be well formed after removal");
            for (var j = -5; j < 15; ++j) {
                var findResult = btree.find(j.toString());
                assert(findResult.isDefined == (j >= 0 && j <= 20 && (j % 4 != 0 || j == 0 || j > i)), "Find result.isDefined was " + findResult.isDefined + " when searching for " + j + " after deleting " + i);
                if (findResult.isDefined) {
                    assert(findResult.get.key == j.toString(), "Found key should be searched key");
                    assert(findResult.get.value == j, "Found value should be correct");
                    assert(findResult.get.priority == priority(j), "Found priority should be correct");
                }
            }
        }
        btree = new BTree(JSON.parse(JSON.stringify(btree.data)), lt);
        for (var i = 1; i < 20; ++i) {
            var res = btree.remove(i.toString());
            assert(btree.isWellFormed(), "BTree should be well formed after removal");
            assert(!btree.isEmpty(), "BTree should not have isEmpty untill all elements have been removed.");
            assert(!btree.find(i.toString()).isDefined, "Removed key " + i + " should not be findable");
            priorities[i] = -5000000;
            assert(btree.findMaxPriority().isDefined, "Max priority element should exist");
            assert(btree.findMaxPriority().get.priority == maxPriority(priorities), "Incorrect max priority");
        }
        btree.remove("0");
        assert(btree.isWellFormed(), "BTree shouldbe well formed after removing all elements");
        assert(btree.isEmpty(), "Btree should have isEmpty after removing all elements.");
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
            if (e.stack) {
                log.warn(e.stack);
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
