var log = {
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,
    //vvvvvvvvv
    CURRENT: 3,
    //^^^^^^^^^
    print: function (msg, level) {
        if (level >= log.CURRENT)
            console.log("[" + log.levelString(level) + "]:\t" + msg);
    },
    debug: function (msg) { log.print(msg, log.DEBUG); },
    info: function (msg) { log.print(msg, log.INFO); },
    warn: function (msg) { log.print(msg, log.WARN); },
    error: function (msg) { log.print(msg, log.ERROR); },
    levelString: function (level) {
        if (level <= log.DEBUG)
            return "DEBUG";
        else if (level == log.INFO)
            return "INFO";
        else if (level == log.WARN)
            return "WARN";
        else if (level == log.ERROR)
            return "ERROR";
        else
            return level.toString();
    }
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
//====================================================================
var ArrayUtils = (function () {
    function ArrayUtils() {
    }
    ArrayUtils.foreach = function (array, func) {
        for (var elemi = 0; elemi < array.length; ++elemi) {
            func(array[elemi]);
        }
    };
    ArrayUtils.find = function (array, func) {
        for (var elemi = 0; elemi < array.length; ++elemi) {
            if (func(array[elemi]))
                return OptionUtils.some(array[elemi]);
        }
        return OptionUtils.none();
    };
    ArrayUtils.findOrThrow = function (array, func, errorMsg) {
        var resOpt = ArrayUtils.find(array, func);
        return OptionUtils.getOrThrow(resOpt, errorMsg);
    };
    ArrayUtils.map = function (input, func) {
        var result = [];
        for (var i = 0; i < input.length; ++i)
            result.push(func(input[i]));
        return result;
    };
    ArrayUtils.sum = function (input) {
        var result = 0;
        for (var i = 0; i < input.length; ++i)
            result = result + input[i];
        return result;
    };
    ArrayUtils.filter = function (input, f) {
        var result = [];
        for (var i = 0; i < input.length; ++i) {
            if (f(input[i]))
                result.push(input[i]);
        }
        return result;
    };
    ArrayUtils.toStringDictionary = function (keys, values) {
        var result = {};
        for (var i = 0; i < keys.length && i < values.length; ++i) {
            result[keys[i]] = values[i];
        }
        return result;
    };
    ArrayUtils.append = function (a1, a2) {
        var result = [];
        for (var i = 0; i < a1.length; ++i) {
            result.push(a1[i]);
        }
        for (var i = 0; i < a2.length; ++i) {
            result.push(a2[i]);
        }
        return result;
    };
    ArrayUtils.exists = function (input, f) {
        for (var i = 0; i < input.length; ++i) {
            if (f(input[i]))
                return true;
        }
        return false;
    };
    return ArrayUtils;
})();
//==============================================================================
// do a binary search to find the smallest number in (lo, hi] for which check returns true
// assumes that check(lo) == false and check(hi) == true and lo + 1 <= hi
// and that there is an answer k such that 
//    lo < k <= hi
//    and check( i ) == false for all i such that lo <= i < k
//    and check( i ) == true for all i such that k <= i < hi
var firstTrueBinarySearch = function (lo, hi, check) {
    assert(lo + 1 <= hi, "Assumptions for binary search not satisfied");
    if (hi == lo + 1)
        return hi;
    var mid = Math.floor((lo + hi) / 2);
    if (check(mid))
        return firstTrueBinarySearch(lo, mid, check);
    else
        return firstTrueBinarySearch(mid, hi, check);
};
//==============================================================================
var LazyValue = (function () {
    function LazyValue(creator) {
        this.memo = OptionUtils.none();
        this.creator = creator;
    }
    LazyValue.prototype.get = function () {
        if (!this.memo.isDefined) {
            this.memo = OptionUtils.some(this.creator());
        }
        return this.memo.get;
    };
    return LazyValue;
})();
//==============================================================================
var OptionUtils = (function () {
    function OptionUtils() {
    }
    OptionUtils.some = function (value) { return { isDefined: true, get: value }; };
    ;
    OptionUtils.none = function () { return { isDefined: false, get: null }; };
    ;
    OptionUtils.getOrThrow = function (opt, errMsg) {
        if (opt.isDefined)
            return opt.get;
        else
            throw errMsg;
    };
    return OptionUtils;
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
    Queue.createFromArray = function (input) {
        return {
            popArray: [],
            pushArray: input
        };
    };
    return Queue;
})();
//==============================================================================
var MemoryUtils = (function () {
    function MemoryUtils() {
    }
    MemoryUtils.initMemory = function (game, memory) {
        var strategy = [];
        var tactic = [];
        var formations = {};
        var idleCreeps = [];
        var scheduledCreeps = {};
        var spawningCreeps = {};
        strategy.push({ typeName: "ScanEndPointsTask" }, { typeName: "ExtendFormationTask" }, { typeName: "CreateArcherFormationTask" });
        memory.centralMemory = {
            strategy: strategy,
            tactic: tactic,
            formations: formations,
            idleCreeps: idleCreeps,
            scheduledCreeps: scheduledCreeps,
            spawningCreeps: spawningCreeps,
            uniqueCounter: 10,
            startingTime: game.time
        };
        for (var spawnName in game.spawns) {
            game.spawns[spawnName].memory = {
                tacticQueue: BTree.emptyBTree(cmpString).data,
                strategyQueue: BTree.emptyBTree(cmpString).data
            };
        }
    };
    //initialize memory if required
    MemoryUtils.update = function (context) {
        if (!context.memory.centralMemory)
            MemoryUtils.initMemory(context.game, context.memory);
        MemoryUtils.processSpawnedCreeps(context.game, context.memory);
        MemoryUtils.processHostileCreeps(context);
    };
    MemoryUtils.uniqueNumber = function (memory) {
        return ++memory.centralMemory.uniqueCounter;
    };
    MemoryUtils.processSpawnedCreeps = function (game, memory) {
        var spawningCreeps = memory.centralMemory.spawningCreeps;
        var spawnedCreeps = [];
        for (var creepName in spawningCreeps) {
            if (!(typeof game.creeps[creepName] === "undefined") && game.creeps[creepName].spawning == false) {
                spawnedCreeps.push(creepName);
            }
        }
        for (var sc = 0; sc < spawnedCreeps.length; ++sc) {
            var cn = spawnedCreeps[sc];
            delete spawningCreeps[cn];
        }
    };
    MemoryUtils.getTimeSinceStart = function (context) {
        return context.game.time - context.memory.centralMemory.startingTime;
    };
    MemoryUtils.processHostileCreeps = function (context) {
        for (var spawnName in context.game.spawns) {
            var spawn = context.game.spawns[spawnName];
            var room = spawn.room;
            var enemyCreeps = room.find(FIND_HOSTILE_CREEPS);
            var enemyCreeps = ArrayUtils.filter(enemyCreeps, CreepUtils.notSourceKeeper);
            //TODO: investigate why so many archers get scheduled
            var numEnemies = enemyCreeps.length;
            for (var formationName in context.memory.centralMemory.formations) {
                if (numEnemies == 0)
                    break;
                var formation = context.memory.centralMemory.formations[formationName];
                if (!formation.isMilitary)
                    continue;
                if (numEnemies - FormationUtils.numSoldiers(formation) > 0) {
                    FormationUtils.extend(formation, spawn, context, true);
                }
                numEnemies = numEnemies - FormationUtils.numSoldiers(formation);
            }
        }
    };
    return MemoryUtils;
})();
//==============================================================================
var cmpString = function (a, b) {
    return a < b;
};
//==============================================================================
var SpawnUtils = (function () {
    function SpawnUtils() {
    }
    //process spawn in main loop
    //extracts from tacticQueue or strategyQueue (in that order), and schedules it
    SpawnUtils.process = function (spawn, context) {
        //check which queue to pick from
        var buildQueue = SpawnUtils.getBTree(spawn.memory.tacticQueue);
        if (buildQueue.length() == 0)
            buildQueue = SpawnUtils.getBTree(spawn.memory.strategyQueue);
        if (buildQueue.length() == 0)
            return;
        //attempt to build the topmost one
        var topOpt = buildQueue.findMaxPriority();
        if (!topOpt.isDefined)
            return;
        var top = topOpt.get;
        var result = spawn.createCreep(top.value.body, top.value.name, top.value.memory);
        //if attempt was successful, remove it from build queue
        if (result == top.value.name) {
            buildQueue.remove(top.key);
            var scheduledCreeps = context.memory.centralMemory.scheduledCreeps;
            if (scheduledCreeps[top.value.name]) {
                delete scheduledCreeps[top.value.name];
            }
            context.memory.centralMemory.spawningCreeps[top.value.name] = spawn.name;
        }
    };
    SpawnUtils.getBTree = function (data) {
        return new BTree(data, cmpString);
    };
    SpawnUtils.schedule = function (spawn, creep, memory, priority, tactical) {
        var q = null;
        if (tactical)
            q = SpawnUtils.getBTree(spawn.memory.tacticQueue);
        else
            q = SpawnUtils.getBTree(spawn.memory.strategyQueue);
        q.insertOrUpdate(creep.name, creep, priority);
        memory.centralMemory.scheduledCreeps[creep.name] = spawn.name;
    };
    return SpawnUtils;
})();
//==============================================================================
var CreepUtils = (function () {
    function CreepUtils() {
    }
    CreepUtils.isDead = function (name, game, memory) {
        return !CreepUtils.isFunctional(name, game) && !CreepUtils.isScheduled(name, memory) && !CreepUtils.isSpawning(name, memory);
    };
    CreepUtils.isFunctional = function (name, game) {
        return !(typeof game.creeps[name] === "undefined");
    };
    CreepUtils.isScheduled = function (name, memory) {
        return !(typeof memory.centralMemory.scheduledCreeps[name] === "undefined");
    };
    CreepUtils.isSpawning = function (name, memory) {
        return !(typeof memory.centralMemory.spawningCreeps[name] === "undefined");
    };
    // returns true iff no more energy can be taken after this turn
    CreepUtils.take = function (creep, object, objectType) {
        var src = object;
        if (creep.pos.isNearTo(src.pos.x, src.pos.y)) {
            var transfer = CreepUtils.transferDispatch.get()[objectType + "->Creep"];
            if (typeof transfer === "undefined") {
                creep.say("Unable to take energy from type " + objectType);
                return false;
            }
            else {
                return transfer(src, creep);
            }
        }
        else {
            creep.moveTo(object);
            return false;
        }
    };
    // returns true iff no more energy can be given after this turn
    CreepUtils.give = function (creep, object, objectType) {
        var tgt = object;
        if (creep.pos.isNearTo(tgt.pos.x, tgt.pos.y)) {
            var transfer = CreepUtils.transferDispatch.get()["Creep->" + objectType];
            if (typeof transfer === "undefined") {
                creep.say("Unable to give enerty to type " + objectType);
                return false;
            }
            else {
                return transfer(creep, tgt);
            }
        }
        else {
            creep.moveTo(object);
            return false;
        }
    };
    CreepUtils.createHarvestorData = function (energy, memory) {
        var body = CreepUtils.createBody([MOVE, CARRY, WORK], [WORK, MOVE,
            CARRY, WORK, WORK, MOVE,
            CARRY, WORK, WORK, MOVE,
            CARRY, WORK, WORK, MOVE,
            CARRY, WORK, WORK, MOVE
        ], energy);
        var name = "Creep" + MemoryUtils.uniqueNumber(memory);
        var creepMemory = {
            typeName: "Harvester",
            formation: ""
        };
        return {
            name: name,
            body: body,
            memory: creepMemory
        };
    };
    CreepUtils.createTransporterData = function (energy, memory) {
        var body = CreepUtils.createBody([MOVE, CARRY], [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY,
            MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY
        ], energy);
        var name = "Creep" + MemoryUtils.uniqueNumber(memory);
        var creepMemory = {
            typeName: "Transporter",
            formation: ""
        };
        return {
            name: name,
            body: body,
            memory: creepMemory
        };
    };
    CreepUtils.createArcherData = function (energy, memory) {
        var body = CreepUtils.createBody([MOVE, RANGED_ATTACK], [MOVE, RANGED_ATTACK,
            MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK,
            MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK,
            MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK,
            MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK,
            MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK
        ], energy);
        var name = "Creep" + MemoryUtils.uniqueNumber(memory);
        var creepMemory = {
            typeName: "Archer",
            formation: ""
        };
        return {
            name: name,
            body: body,
            memory: creepMemory
        };
    };
    CreepUtils.createBody = function (minimumBody, addOns, energy) {
        var result = [];
        var remainingEnergy = energy;
        for (var mbi = 0; mbi < minimumBody.length; ++mbi) {
            remainingEnergy = remainingEnergy - CreepUtils.getBodyCost(minimumBody[mbi]);
            if (remainingEnergy < 0) {
                throw "Energy " + energy + " is sufficient for only first " + mbi + " parts in minimumBody " + JSON.stringify(minimumBody);
            }
            result.push(minimumBody[mbi]);
        }
        for (var aoi = 0; aoi < addOns.length; ++aoi) {
            remainingEnergy = remainingEnergy - CreepUtils.getBodyCost(addOns[aoi]);
            if (remainingEnergy < 0)
                return result;
            result.push(addOns[aoi]);
        }
        return result;
    };
    CreepUtils.getBodyCost = function (bodyType) {
        var result = CreepUtils.bodyCosts.get()[bodyType.toString().valueOf()];
        if (typeof result === "undefined") {
            log.error("Could not find cost for body type " + bodyType.toString());
            return 0;
        }
        return result;
    };
    CreepUtils.transferDispatch = new LazyValue(function () {
        var res = {};
        var creepTransfer = function (src, tgt) {
            src.transfer(tgt, RESOURCE_ENERGY);
            return true;
        };
        res["Creep->Creep"] = creepTransfer;
        res["Creep->Spawn"] = creepTransfer;
        res["Source->Creep"] = function (src, tgt) {
            tgt.harvest(src);
            return (tgt.carry.energy == tgt.carryCapacity
                || src.energy <= 5);
        };
        return res;
    });
    CreepUtils.bodyCosts = new LazyValue(function () {
        var bodyTypesAndCosts = [
            { v1: MOVE, v2: 50 },
            { v1: WORK, v2: 100 },
            { v1: CARRY, v2: 50 },
            { v1: ATTACK, v2: 80 },
            { v1: RANGED_ATTACK, v2: 150 },
            { v1: HEAL, v2: 250 },
            { v1: CLAIM, v2: 600 },
            { v1: TOUGH, v2: 10 }
        ];
        var result = {};
        for (var i = 0; i < bodyTypesAndCosts.length; ++i) {
            result[bodyTypesAndCosts[i].v1.toString().valueOf()] = bodyTypesAndCosts[i].v2;
        }
        return result;
    });
    CreepUtils.notSourceKeeper = function (cr) {
        return cr == null || cr.owner.username !== "Source Keeper";
    };
    return CreepUtils;
})();
var ArcherFormationOps = {
    typeName: "ArcherFormation",
    execute: function (formation, context) {
        var af = formation;
        if (af.archers.length == 0)
            return;
        var isAlive = function (crn) { return !CreepUtils.isDead(crn, context.game, context.memory); };
        var isActive = function (crn) { return CreepUtils.isFunctional(crn, context.game); };
        var getCreep = function (crn) { return context.game.creeps[crn]; };
        var getX = function (cr) { return cr.pos.x; };
        var getY = function (cr) { return cr.pos.y; };
        af.archers = ArrayUtils.filter(af.archers, isAlive);
        var activeCrns = ArrayUtils.filter(af.archers, isActive);
        if (activeCrns.length == 0)
            return;
        var crs = ArrayUtils.map(activeCrns, getCreep);
        var target = context.game.getObjectById(af.targetId);
        var targetType = af.targetType;
        var room = crs[0].room;
        if (target == null || target.pos.roomName != room.name) {
            var avgX = Math.ceil(ArrayUtils.sum(ArrayUtils.map(crs, getX)) / crs.length);
            var avgY = Math.ceil(ArrayUtils.sum(ArrayUtils.map(crs, getY)) / crs.length);
            var avgPos = room.getPositionAt(avgX, avgY);
            target = avgPos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (!CreepUtils.notSourceKeeper(target))
                target = null;
            targetType = "Creep";
            if (target == null) {
                target = avgPos.findClosestByRange(FIND_HOSTILE_SPAWNS);
                if (!CreepUtils.notSourceKeeper(target))
                    target = null;
                targetType = "Spawn";
            }
            if (target == null) {
                target = avgPos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
                if (!CreepUtils.notSourceKeeper(target))
                    target = null;
                targetType = "Structure";
            }
            if (target == null) {
                target = avgPos.findClosestByRange(FIND_HOSTILE_CONSTRUCTION_SITES);
                if (!CreepUtils.notSourceKeeper(target))
                    target = null;
                targetType = "ConstructionSite";
            }
            if (target == null)
                return;
        }
        af.targetId = target.id;
        af.targetType = targetType;
        var targetPos = target.pos;
        for (var cri = 0; cri < crs.length; ++cri) {
            var cr = crs[cri];
            var distance = cr.pos.getRangeTo(targetPos.x, targetPos.y);
            if (distance > 3) {
                cr.rangedMassAttack();
                cr.moveTo(targetPos);
            }
            if (distance < 3) {
                //TODO: move to bext possible place considering obstacles
                cr.move(targetPos.getDirectionTo(cr.pos.x, cr.pos.y));
            }
            cr.rangedAttack(target);
        }
    },
    extend: function (formation, spawn, context, tactical) {
        var af = formation;
        var isAlive = function (crn) {
            return !CreepUtils.isDead(crn, context.game, context.memory);
        };
        var isScheduled = function (crn) {
            return CreepUtils.isScheduled(crn, context.memory);
        };
        af.archers = ArrayUtils.filter(af.archers, isAlive);
        var isAlreadyScheduled = ArrayUtils.exists(af.archers, isScheduled);
        if (af.archers.length < 5 && (!isAlreadyScheduled || tactical)) {
            var archerData = CreepUtils.createArcherData(spawn.energyCapacity, context.memory);
            archerData.memory.formation = af.name;
            af.archers.push(archerData.name);
            SpawnUtils.schedule(spawn, archerData, context.memory, 1 + 1 / (af.archers.length + 1), tactical);
        }
    },
    numSoldiers: function (formation) {
        return formation.archers.length;
    },
    createNew: function (spawn, context) {
        var af = {
            name: "Formation" + MemoryUtils.uniqueNumber(context.memory),
            typeName: "ArcherFormation",
            isMilitary: true,
            targetId: "",
            targetType: "",
            archers: [],
            roomName: spawn.pos.roomName
        };
        context.memory.centralMemory.formations[af.name] = af;
    }
};
var ExtractorFormationOps = {
    typeName: "ExtractorFormation",
    execute: function (formation, context) {
        // downcast formation
        var ef = formation;
        // filter out dead creeps
        var isDead = function (name) {
            return !CreepUtils.isDead(name, context.game, context.memory);
        };
        ef.extractorCreeps = ArrayUtils.filter(ef.extractorCreeps, isDead);
        ef.transporterCreeps = ArrayUtils.filter(ef.transporterCreeps, isDead);
        // filter out dead statuses, and set default status to "take"
        var allCreeps = ArrayUtils.append(ef.extractorCreeps, ef.transporterCreeps);
        var allStatuses = ArrayUtils.map(allCreeps, function (crn) {
            if (typeof ef.creepStatus[crn] === "undefined")
                return "take";
            else
                return ef.creepStatus[crn];
        });
        ef.creepStatus = ArrayUtils.toStringDictionary(allCreeps, allStatuses);
        // get active creeps
        var isActive = function (crName) {
            return CreepUtils.isFunctional(crName, context.game);
        };
        var activeExtractors = ArrayUtils.filter(ef.extractorCreeps, isActive);
        var activeTransporters = ArrayUtils.filter(ef.transporterCreeps, isActive);
        // source and target for extractors
        var source = context.game.getObjectById(ef.sourceId);
        var sourceType = ef.sourceType;
        var target = context.game.getObjectById(ef.targetId);
        var targetType = ef.targetType;
        if (activeTransporters.length > 0) {
            target = context.game.creeps[activeTransporters[0]];
            targetType = "Creep";
        }
        // process extractors
        for (var i = 0; i < activeExtractors.length; ++i) {
            var crn = activeExtractors[i]; // creep name
            var cr = context.game.creeps[crn]; // creep
            var crs = ef.creepStatus[crn]; // creep status
            if (crs === "take" && CreepUtils.take(cr, source, sourceType)) {
                crs = "give";
                // if extractor is full then this formation could use more transporters
                if (cr.carry.energy == cr.carryCapacity &&
                    activeTransporters.length == ef.transporterCreeps.length // check if already scheduled
                )
                    ExtractorFormationOps.addTransporter(ef, cr.room, context, false);
            }
            if (crs === "give" && CreepUtils.give(cr, target, targetType))
                crs = "take";
            // update post-processing creep status
            ef.creepStatus[crn] = crs;
        }
        // process transporters
        for (var i = 0; i < activeTransporters.length; ++i) {
            var crn = activeTransporters[i]; // creep name
            var cr = context.game.creeps[crn]; // creep
            var crs = ef.creepStatus[crn]; // creep status
            // set source and sourceType
            // first transporter creep should take from nextExtractor, or ef.source
            // everyone else should take from previous transporter
            if (i == 0) {
                if (activeExtractors.length == 0) {
                    source = context.game.getObjectById(ef.sourceId);
                    sourceType = ef.sourceType;
                }
                else {
                    source = context.game.creeps[activeExtractors[ef.nextExtractor % activeExtractors.length]];
                    sourceType = "Creep";
                }
            }
            else {
                source = context.game.creeps[activeTransporters[i - 1]];
                sourceType = "Creep";
            }
            // set target and targetType
            if (i + 1 < activeTransporters.length) {
                targetType = "Creep";
                target = context.game.creeps[activeTransporters[i + 1]];
            }
            else {
                targetType = ef.targetType;
                target = context.game.getObjectById(ef.targetId);
            }
            // actual processing logic
            if (crs === "give" && CreepUtils.give(cr, target, targetType))
                crs = "take";
            if (crs === "take" && CreepUtils.take(cr, source, sourceType)) {
                crs = "give";
                // cycle the first transporter across extractors
                if (i == 0 && activeExtractors.length > 0) {
                    ef.nextExtractor = (ef.nextExtractor + 1) % activeExtractors.length;
                    // keep taking till you're full, or if you've completed one cycle
                    if (cr.carry.energy < cr.carryCapacity && ef.nextExtractor != 0)
                        crs = "take";
                }
            }
            // update post-processing creep status
            ef.creepStatus[crn] = crs;
        }
    },
    extend: function (f, spawn, context, tactical) {
        var ef = f;
        var isFunctional = function (name) {
            return CreepUtils.isFunctional(name, context.game);
        };
        var activeExtr = ArrayUtils.filter(ef.extractorCreeps, isFunctional);
        var numExtr = activeExtr.length; // number of active extractors
        var getWorkAmount = function (crn) {
            return context.game.creeps[crn].getActiveBodyparts(WORK);
        };
        var numWork = ArrayUtils.sum(// total work parts
        ArrayUtils.map(activeExtr, getWorkAmount));
        if (numWork * GameConstants.harvestPerWorkBpPerTick * GameConstants.sourceRechargeTime >=
            GameConstants.sourceCapacity)
            return;
        var source = context.game.getObjectById(ef.sourceId);
        var room = source.room;
        var x = source.pos.x;
        var y = source.pos.y;
        var freeCells = 0; // number of free cells surrounding the source
        for (var dx = -1; dx <= 1; ++dx) {
            for (var dy = -1; dy <= 1; ++dy) {
                if (GameUtils.getTerrain(room, x + dx, y + dy) !== "wall" &&
                    GameUtils.getStructures(room, x + dx, y + dy).length == 0) {
                    ++freeCells;
                }
            }
        }
        if (freeCells <= numExtr)
            return;
        ExtractorFormationOps.addExtractor(ef, context, spawn, tactical);
    },
    numSoldiers: function (f) {
        return 0;
    },
    addTransporter: function (ef, room, context, tactical) {
        var allSpawns = room.find(FIND_MY_SPAWNS);
        if (allSpawns.length == 0)
            return;
        var spawn = allSpawns[0];
        var energy = spawn.energyCapacity;
        var buildData = CreepUtils.createTransporterData(energy, context.memory);
        buildData.memory.formation = ef.name;
        var pathLen = ExtractorFormationOps.pathLen(ef, context.game);
        SpawnUtils.schedule(spawn, buildData, context.memory, 1 + 1000 / pathLen, tactical);
        ef.transporterCreeps.push(buildData.name);
    },
    addExtractor: function (ef, context, spawn, tactical) {
        var energy = spawn.energyCapacity;
        var buildData = CreepUtils.createHarvestorData(energy, context.memory);
        buildData.memory.formation = ef.name;
        var pathLen = ExtractorFormationOps.pathLen(ef, context.game);
        SpawnUtils.schedule(spawn, buildData, context.memory, 1 + 1000 / pathLen, tactical);
        ef.extractorCreeps.push(buildData.name);
    },
    pathLen: function (ef, game) {
        var sourcePos = game.getObjectById(ef.sourceId).pos;
        var targetPos = game.getObjectById(ef.targetId).pos;
        return sourcePos.getRangeTo(targetPos.x, targetPos.y);
    }
};
//==============================================================================
var GameConstants = {
    // number of energy units harvestable by a creep
    // per WORK body part per tick
    harvestPerWorkBpPerTick: 2,
    // Full capacity of a source
    sourceCapacity: 3000,
    // No of ticks between source recharges
    sourceRechargeTime: 300,
    // Time between enemy waves
    enemyWaveFrequency: 200
};
//==============================================================================
var GameUtils = {
    getTerrain: function (room, x, y) {
        var terrains = room.lookForAt("terrain", x, y);
        var funcIsWall = function (terrain) { return terrain.terrain === "wall"; };
        var funcIsSwamp = function (terrain) { return terrain.terrain === "swamp"; };
        if (ArrayUtils.exists(terrains, funcIsWall))
            return "wall";
        if (ArrayUtils.exists(terrains, funcIsSwamp))
            return "swamp";
        return "plain";
    },
    getStructures: function (room, x, y) {
        return room.lookForAt("structure", x, y);
    }
};
//==============================================================================
var FormationUtils = (function () {
    function FormationUtils() {
    }
    //Do whatever the formation needs to do
    FormationUtils.execute = function (formation, context) {
        FormationUtils.dispatch.get()[formation.typeName].execute(formation, context);
    };
    FormationUtils.extend = function (formation, spawn, context, tactical) {
        FormationUtils.dispatch.get()[formation.typeName].extend(formation, spawn, context, tactical);
    };
    FormationUtils.numSoldiers = function (formation) {
        return FormationUtils.dispatch.get()[formation.typeName].numSoldiers(formation);
    };
    //Get a FormationOps for a given formation type
    //usage: FormationUtils.dispatch.get()[typeName]
    FormationUtils.dispatch = new LazyValue(function () {
        var allOps = [ExtractorFormationOps, ArcherFormationOps];
        var result = {};
        for (var i = 0; i < allOps.length; ++i) {
            result[allOps[i].typeName] = allOps[i];
        }
        return result;
    });
    return FormationUtils;
})();
//==============================================================================
var ScanEndPointsTaskOps = {
    typeName: "ScanEndPointsTask",
    schedule: function (task, context) {
        for (var roomName in context.game.rooms) {
            //For every room
            var room = context.game.rooms[roomName];
            var allSources = room.find(FIND_SOURCES_ACTIVE);
            for (var isrc = 0; isrc < allSources.length; ++isrc) {
                //for every source in that room
                var source = allSources[isrc];
                //skip sources with KeeperLairs in range
                var isLair = function (s) {
                    return s.structureType === STRUCTURE_KEEPER_LAIR;
                };
                var lairsInRange = source.pos.findInRange(FIND_STRUCTURES, 5, { filter: isLair });
                if (lairsInRange.length > 0) {
                    break;
                }
                //Find closest spawn to the source
                var isSpawn = function (s) {
                    return s.structureType === STRUCTURE_SPAWN;
                };
                var closestSpawn = source.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: isSpawn });
                if (closestSpawn == null || closestSpawn.pos.roomName !== source.pos.roomName)
                    break;
                var formation = {
                    name: "Formation" + MemoryUtils.uniqueNumber(context.memory),
                    typeName: "ExtractorFormation",
                    isMilitary: false,
                    sourceId: source.id,
                    sourceType: "Source",
                    targetId: closestSpawn.id,
                    targetType: "Spawn",
                    extractorCreeps: [],
                    transporterCreeps: [],
                    creepStatus: {},
                    nextExtractor: 0
                };
                ExtractorFormationOps.addExtractor(formation, context, closestSpawn, false);
                //create a supplyChain from source to spawn
                context.memory.centralMemory.formations[formation.name] = formation;
            }
        }
        return true;
    }
};
//==============================================================================
var ExtendFormationTaskOps = {
    typeName: "ExtendFormationTask",
    schedule: function (task, context) {
        for (var spawnName in context.game.spawns) {
            var spawn = context.game.spawns[spawnName];
            var strategyQueue = SpawnUtils.getBTree(spawn.memory.strategyQueue);
            for (var formationName in context.memory.centralMemory.formations) {
                if (strategyQueue.length() > 0)
                    break;
                FormationUtils.extend(context.memory.centralMemory.formations[formationName], spawn, context, false);
            }
        }
        return false;
    }
};
//==============================================================================
var CreateArcherFormationTaskOps = {
    typeName: "CreateArcherFormationTask",
    schedule: function (task, context) {
        if (MemoryUtils.getTimeSinceStart(context) % 100 == 50) {
            for (var spawnName in context.game.spawns) {
                var spawn = context.game.spawns[spawnName];
                ArcherFormationOps.createNew(spawn, context);
            }
        }
        return false;
    }
};
//==============================================================================
var TaskUtils = (function () {
    function TaskUtils() {
    }
    TaskUtils.schedule = function (t, context) {
        var ops = TaskUtils.dispatch.get()[t.typeName];
        if (typeof ops === "undefined") {
            log.error("Could not find TaskOps for task type " + t.typeName);
            return false;
        }
        return ops.schedule(t, context);
    };
    TaskUtils.dispatch = new LazyValue(function () {
        var allOps = [ScanEndPointsTaskOps, ExtendFormationTaskOps, CreateArcherFormationTaskOps];
        var result = {};
        for (var i = 0; i < allOps.length; ++i) {
            result[allOps[i].typeName] = allOps[i];
        }
        return result;
    });
    return TaskUtils;
})();
//==============================================================================
var StrategyUtils = (function () {
    function StrategyUtils() {
    }
    StrategyUtils.process = function (context) {
        var processTask = function (t) { return !TaskUtils.schedule(t, context); };
        var memory = context.memory;
        if (memory.centralMemory.tactic.length > 0) {
            memory.centralMemory.tactic = ArrayUtils.filter(memory.centralMemory.tactic, processTask);
        }
        else {
            memory.centralMemory.strategy = ArrayUtils.filter(memory.centralMemory.strategy, processTask);
        }
    };
    return StrategyUtils;
})();
//==============================================================================
module.exports.loop = function () {
    log.debug("Main");
    var cleanUps = [];
    var context = { game: Game, memory: Memory, cleanUps: cleanUps };
    //Analyse the current situation
    MemoryUtils.update(context);
    StrategyUtils.process(context);
    for (var spawnName in Game.spawns) {
        var spawn = Game.spawns[spawnName];
        SpawnUtils.process(spawn, context);
    }
    for (var formationName in Memory.centralMemory.formations) {
        var formation = Memory.centralMemory.formations[formationName];
        FormationUtils.execute(formation, context);
    }
    for (var i = 0; i < cleanUps.length; ++i) {
        cleanUps[i].apply();
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
