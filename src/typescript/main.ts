
var log = {
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,

    //vvvvvvvvv
    CURRENT: 3,
    //^^^^^^^^^

    print: function(msg: String, level: number) {
        if (level >= this.CURRENT) console.log("[" + log.levelString(level) + "]:\t" + msg);
    },
    debug: function(msg: String) { this.print(msg, this.DEBUG); },
    info: function(msg: String) { this.print(msg, this.INFO); },
    warn: function(msg: String) { this.print(msg, this.WARN); },
    error: function(msg: String) { this.print(msg, this.ERROR); },

    levelString: function(level: number): String {
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
class ArrayUtils {
    static foreach<TElem>(array: Array<TElem>, func: (TElem) => void): void {
        for (var elemi = 0; elemi < array.length; ++elemi) {
            func(array[elemi]);
        }
    }
    static find<TElem>(array: Array<TElem>, func: (TElem) => boolean): Option<TElem> {
        for (var elemi = 0; elemi < array.length; ++elemi) {
            if (func(array[elemi]))
                return OptionUtils.some<TElem>(array[elemi]);
        }
        return OptionUtils.none<TElem>();
    }
    static findOrThrow<TElem>(
        array: Array<TElem>, 
        func: (TElem) => boolean,
            errorMsg: String
    ): TElem 
    {
        var resOpt = ArrayUtils.find<TElem>(array, func);
        return OptionUtils.getOrThrow(resOpt, errorMsg);
    }
    static map<TInput, TOutput>(
        input: Array<TInput>,
        func: (TInput) => TOutput
    ): Array<TOutput>
    {
        var result: Array<TOutput> = [];
        for (var i = 0; i < input.length; ++i)
        result.push(func(input[i]));
        return result;
    }

    static sum(input: Array<number>): number {
        var result = 0;
        for (var i = 0; i < input.length; ++i)
        result = result + input[i];
        return result;
    }

    static filter<TElem>(input: Array<TElem>, f: (TElem) => boolean): Array<TElem> {
        var result: Array<TElem> = [];
        for( var i = 0; i < input.length; ++i ) {
            if(f(input[i]))
                result.push(input[i]);
        }
        return result;
    }

    static toStringDictionary<TValue>(keys: Array<string>, values: Array<TValue>): StringDictionary<TValue> {
        var result: StringDictionary<TValue> = { };
        for (var i = 0; i < keys.length && i < values.length; ++i) {
            result[keys[i]] = values[i];
        }
        return result;
    }
}

//==============================================================================
class LazyValue<TValue>{
    memo: Option<TValue>;
    creator: () => TValue;
    constructor(creator: () => TValue) {
        this.memo = OptionUtils.none<TValue>();
        this.creator = creator;
    }
    get(): TValue {
        if (!this.memo.isDefined) {
            this.memo = OptionUtils.some<TValue>(this.creator());
        }
        return this.memo.get;
    }
}


//==============================================================================
class OptionUtils{
    public static some<TElem>(value: TElem): Option<TElem> { return {isDefined: true,  get: value}; };
    public static none<TElem>()            : Option<TElem> { return {isDefined: false, get: null }; };
    public static getOrThrow<TElem>(
        opt: Option<TElem>,
        errMsg: String
    ): TElem {
        if (opt.isDefined) return opt.get;
        else throw errMsg;
    }
}

//====================================================================
interface InsertionResult<TKey, TValue> { 
    left: BTreeData<TKey, TValue>;
    mid: BTreeValueData<TKey, TValue>;
    right: BTreeData<TKey, TValue>;
}

interface DeletionResult<TKey, TValue> {
    deletedValue: Option<BTreeValueData<TKey, TValue>>;
    balancingResult: Option<InsertionResult<TKey, TValue>>;
}


class BTree<TKey, TValue> {
    data: BTreeData<TKey, TValue>;
    klt: (a: TKey, b:TKey) => boolean;
    constructor(_data: BTreeData<TKey, TValue>, _klt: (TKey, Tkey) => boolean) {
        this.data = _data;
        this.klt = _klt;
    }

    kgt(l: TKey, r: TKey): boolean { return this.klt(r, l); }
    keq(l: TKey, r: TKey): boolean { return (!this.klt(l, r) && !this.klt(r, l)); }
    kleq(l: TKey, r: TKey): boolean { return !this.klt(r, l); }
    kgeq(l: TKey, r: TKey): boolean { return !this.klt(l, r); }
    kneq(l: TKey, r: TKey): boolean { return (this.klt(l, r) || this.klt(r, l)); }

    find(key: TKey): Option<BTreeValueData<TKey, TValue>> {
        if (this.data.isEmpty)
            return { isDefined: false, get: null };
        for (var vi = 0; vi < this.data.values.length && this.kleq(this.data.values[vi].key, key); ++vi) {
            if (this.keq(this.data.values[vi].key, key))
                return { isDefined: true, get: this.data.values[vi] };
        }
        if (this.data.isLeaf)
            return { isDefined: false, get: null };
        assert(
            this.data.children.length > vi,
            "Non leaf BTree has " +
                this.data.values.length + " values but " +
                this.data.children.length + " children."
        );
        return new BTree<TKey, TValue>(this.data.children[vi], this.klt).find(key);
    }

    insertOrUpdate(key: TKey, value: TValue, priority: number): void {
        if (this.data.isEmpty) {
            this.data.isLeaf = true;
            this.data.values.push({ key: key, value: value, priority: priority });
            this.data.isEmpty = false;
            this.data.children = [];
            BTree.refreshDerivedProperties<TKey, TValue>(this.data);
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
        BTree.refreshDerivedProperties<TKey, TValue>(this.data); // <- Shouldn't be required
    }
    private internalInsert(key: TKey, value: TValue, priority: number): Option<InsertionResult<TKey, TValue>> {
        for (var vi = 0; vi < this.data.values.length && this.kleq(this.data.values[vi].key, key); ++vi) {
            if (this.keq(this.data.values[vi].key, key)) {
                this.data.values[vi].value = value;
                this.data.values[vi].priority = priority;
                BTree.refreshDerivedProperties<TKey, TValue>(this.data);
                return {isDefined: false, get: null};
            }
        }
        if (this.data.isLeaf) {
            this.data.values.splice(vi, 0, { key: key, value: value, priority: priority } );
        } else {
            var insertionResult = 
                new BTree<TKey, TValue>(this.data.children[vi], this.klt).internalInsert(key, value, priority);
            if (insertionResult.isDefined) {
                var res = insertionResult.get;
                this.data.children.splice(vi, 1, res.left, res.right);
                this.data.values.splice(vi, 0, res.mid);
            }
        }
        BTree.refreshDerivedProperties<TKey, TValue>(this.data);
        return this.splitIfRequired();
    }
    private splitIfRequired(): Option<InsertionResult<TKey, TValue>>{
        if (this.data.values.length < 3)
            return { isDefined: false, get: null }
        assert(this.data.values.length <= 5,
               "BTree size should not be greater than 5, found " + this.data.values.length);
        var midValueIndex = Math.floor(this.data.values.length / 2);
        var leftChild: BTreeData<TKey, TValue> = {
            isLeaf: this.data.isLeaf,
            isRoot: false,
            isEmpty: false,
            size: 0,
            maxPriority: 0,
            values: this.data.values.slice(0, midValueIndex),
            children: this.data.children.slice(0, midValueIndex + 1)
        }
        BTree.refreshDerivedProperties<TKey, TValue>(leftChild);
        var rightChild: BTreeData<TKey, TValue> = {
            isLeaf: this.data.isLeaf,
            isRoot: false,
            isEmpty: false,
            size: 0,
            maxPriority: 0,
            values: this.data.values.slice(midValueIndex + 1),
            children: this.data.children.slice(midValueIndex + 1)
        }
        BTree.refreshDerivedProperties<TKey, TValue>(rightChild);
        var insertionResult: InsertionResult<TKey, TValue> = {
            left: leftChild,
            mid: this.data.values[midValueIndex],
            right: rightChild
        }
        return {
            isDefined: true,
            get: insertionResult
        }
    }
    remove(key: TKey): Option<BTreeValueData<TKey, TValue>> {
        var internalRemoveResult = this.internalRemove(key);
        assert(!internalRemoveResult.balancingResult.isDefined, "Root node should not require rebalancing");
        return internalRemoveResult.deletedValue;
    }
    private internalRemove(key: TKey): DeletionResult<TKey, TValue> {
        if (this.data.isRoot && this.data.isLeaf) {
            for (var i = 0; i < this.data.values.length; ++i) {
                if (this.keq(this.data.values[i].key, key)) {
                    var deletedValue: Option<BTreeValueData<TKey, TValue>> = 
                        { isDefined: true, get: this.data.values[i] };
                    this.data.values.splice(i, 1);
                    this.data.isEmpty = (this.data.values.length == 0);
                    BTree.refreshDerivedProperties<TKey, TValue>(this.data);
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
            assert(
                this.data.values.length > 1, 
                "Non-root leaf should have more than one element (found: " + this.data.values.length + ")");
                var deletedValue: Option<BTreeValueData<TKey, TValue>> = { isDefined: false, get: null };
                for (var i = 0; i < this.data.values.length; ++i) {
                    if (this.keq(this.data.values[i].key, key)) {
                        deletedValue = { isDefined: true, get: this.data.values[i] };
                        this.data.values.splice(i, 1);
                        BTree.refreshDerivedProperties<TKey, TValue>(this.data);
                    }
                }
                return {
                    deletedValue: deletedValue,
                    balancingResult: this.splitIfRequired()
                };
        }
        var demotedIndex: number;
        for (demotedIndex = 0; demotedIndex < this.data.values.length - 1 && this.klt(this.data.values[demotedIndex].key, key); ++demotedIndex) 
        {
            //the required operations get triggered in the condition
            //so nothing in for loop body
        }
        var demotedValue = this.data.values[demotedIndex];
        var left = this.data.children[demotedIndex];
        var right = this.data.children[demotedIndex + 1];
        var mergedValues: Array<BTreeValueData<TKey, TValue>> = left.values.concat(demotedValue).concat(right.values);
        var mergedChildren: Array<BTreeData<TKey, TValue>> = left.children.concat(right.children);
        var mergedChild: BTreeData<TKey, TValue> = {
            isLeaf: left.isLeaf,
            isRoot: false,
            isEmpty: false,
            size: 0,
            maxPriority: Math.max(left.maxPriority, right.maxPriority, demotedValue.priority),
            values: mergedValues,
            children: mergedChildren
        };
        BTree.refreshDerivedProperties<TKey,TValue>(mergedChild);

        this.data.values.splice(demotedIndex, 1);
        this.data.children.splice(demotedIndex, 2, mergedChild);
        BTree.refreshDerivedProperties<TKey, TValue>(this.data); // <- should not be needed

        var removeResult = new BTree<TKey, TValue>(mergedChild, this.klt).internalRemove(key);
        if (removeResult.balancingResult.isDefined) {
            var br = removeResult.balancingResult.get;
            this.data.values.splice(demotedIndex, 0, br.mid);
            this.data.children.splice(demotedIndex, 1, br.left, br.right);
            BTree.refreshDerivedProperties<TKey, TValue>(this.data);
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

        BTree.refreshDerivedProperties<TKey, TValue>(this.data); // <- should not be needed
        return {
            deletedValue: removeResult.deletedValue,
            balancingResult: this.splitIfRequired()
        };
    }
    findMaxPriority(): Option<BTreeValueData<TKey, TValue>> {
        return BTree.findMaxPriority<TKey, TValue>(this.data);
    }
    popMaxPriority(): Option<BTreeValueData<TKey, TValue>> {
        var res = this.findMaxPriority();
        if (res.isDefined) 
            this.remove(res.get.key);
        return res;
    }
    length(): number {
        return this.data.size;
    }
    toString(): String {
        return JSON.stringify(this.data);
    }
    prettyPrint(): void {
        console.log();
        BTree.prettyPrint<TKey, TValue>([this.data]);
        console.log();
    }
    isEmpty(): boolean {
        return this.data.isEmpty;
    }
    isWellFormed(): boolean {
        return this.data.isRoot && BTree.isWellFormed<TKey, TValue>(this.data, this.klt);
    }

    static findMaxPriority<TKey, TValue>(data: BTreeData<TKey, TValue>): Option<BTreeValueData<TKey, TValue>> {
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
                return BTree.findMaxPriority<TKey, TValue>(data.children[ci]);
            }
        }
        return  {
            isDefined: false,
            get: null
        };
    }

    static refreshDerivedProperties<TKey, TValue>(data: BTreeData<TKey, TValue>) {
        var maxPriority: number;
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
    }


    static prettyPrint<TKey, TValue>(dataArray: Array<BTreeData<TKey, TValue>>): void {
        var nextLevel: Array<BTreeData<TKey, TValue>> = [];
        var thisLevel: Array<String> = [];
        for (var di = 0; di < dataArray.length; ++di) {
            var data = dataArray[di];
            for (var ci = 0; ci < data.children.length; ++ci) {
                nextLevel.push(data.children[ci]);
            }
            var dataKeys: Array<String> = [];
            for (var vi = 0; vi < data.values.length; ++vi) {
                dataKeys.push(data.values[vi].key.toString());
            }
            thisLevel.push("(" + dataKeys.join(",") + ")");
        }
        console.log(thisLevel.join("  "));
        if(nextLevel.length > 0)
            BTree.prettyPrint<TKey, TValue>(nextLevel);
    }

    static isWellFormed<TKey, TValue>(data: BTreeData<TKey, TValue>, klt: (a: TKey, b: TKey) => boolean): boolean {
        if (data.isEmpty) return (data.values.length == 0 && data.children.length == 0 && data.size == 0);
        if (data.isLeaf != (data.children.length == 0)) return false;
        if (!data.isLeaf && (data.children.length != data.values.length + 1)) return false;
        if (data.values.length < 1 || data.values.length > 2) return false;
        for (var i = 0; i < data.values.length; ++i) {
            if (i < data.values.length - 1 && !klt(data.values[i].key, data.values[i + 1].key)) return false;
            if (!data.isLeaf) {
                var currKey = data.values[i].key;
                var lastPrevChild = data.children[i].values[data.children[i].values.length - 1];
                if (!klt(lastPrevChild.key, currKey)) return false;
                var firstNextChild = data.children[i+1].values[0];
                if (!klt(currKey, firstNextChild.key)) return false;
            }
        }
        var p = data.maxPriority - 1;
        var s = data.values.length;
        for (var i = 0; i < data.values.length; ++i) p = Math.max(p, data.values[i].priority);
        for (var i = 0; i < data.children.length; ++i) {
            p = Math.max(p, data.children[i].maxPriority);
            s += data.children[i].size;
            if (!BTree.isWellFormed<TKey, TValue>(data.children[i], klt)) {
                console.log(JSON.stringify(data.children[i]));
                return false;
            }
        }
        if (p != data.maxPriority) return false;
        if (s != data.size) return false;

        return true;
    }

    static emptyBTree<TKey, TValue>(klt: (a: TKey, b: TKey) => boolean): BTree<TKey, TValue> {
        return new BTree<TKey, TValue>({
            isLeaf: false, isRoot: true, isEmpty: true, size: 0,
            maxPriority: 0, values: [], children: []
        }, klt);
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
    static createFromArray<TElement>(input: Array<TElement>): QueueData<TElement> {
        return {
            popArray: [],
            pushArray: input
        }
    }
}

//==============================================================================
class MemoryUtils {
    static initMemory(game: IGame, memory: IMemory): void {
        var strategy: Array<Task> = [];
        var tactic: Array<Task> = [];
        var formations: StringDictionary<Formation> = {};
        var idleCreeps: Array<string> = [];
        var scheduledCreeps: StringDictionary<string> = {};
        var spawningCreeps: StringDictionary<string> = {};
        for (var spawnName in game.spawns) {
            var spawn = game.spawns[spawnName];
            var sourceId = (<Source>spawn.pos.findClosestByPath(FIND_SOURCES)).id;
            var createHarvestorTask: CreateHarvestorTask = {
                spawnName: spawnName,
                sourceId: sourceId,
                typeName: CreateHarvestorTaskOps.typeName
            };
            strategy.push(createHarvestorTask);
        }
        memory.centralMemory = {
            strategy: strategy,
            tactic: tactic,
            formations: formations,
            idleCreeps: idleCreeps,
            scheduledCreeps: scheduledCreeps,
            spawningCreeps: spawningCreeps,
            uniqueCounter: 10
        }

        for (var spawnName in game.spawns) {
            game.spawns[spawnName].memory = {
                tacticQueue: Queue.emptyQueueData<CreepBuildData>(),
                strategyQueue: Queue.emptyQueueData<CreepBuildData>()
            }
        }
    }
    //initialize memory if required
    static update(game: IGame, memory: IMemory): void {
        if (!memory.centralMemory) MemoryUtils.initMemory(game, memory);
        MemoryUtils.processSpawnedCreeps(game, memory);
    }
    static uniqueNumber(memory: IMemory): number {
        return ++memory.centralMemory.uniqueCounter;
    }
    static processSpawnedCreeps(game: IGame, memory: IMemory): void {
        var spawningCreeps = memory.centralMemory.spawningCreeps;
        var spawnedCreeps: Array<string> = [];
        for (var creepName in spawningCreeps) {
            if (!(typeof game.creeps[creepName] === "undefined") && game.creeps[creepName].spawning == false) {
                spawnedCreeps.push(creepName);
            }
        }
        for (var sc = 0; sc < spawnedCreeps.length; ++sc) {
            var cn = spawnedCreeps[sc];
            delete spawningCreeps[cn];
        }
    }
}

//==============================================================================
class SpawnUtils {
    //process spawn in main loop
    //extracts from tacticQueue or strategyQueue (in that order), and schedules it
    static process(spawn: Spawn, game: IGame, memory: IMemory): void {
        //check which queue to pick from
        var buildQueue = new Queue<CreepBuildData>(spawn.memory.tacticQueue);
        if (buildQueue.length() == 0)
            buildQueue = new Queue<CreepBuildData>(spawn.memory.strategyQueue);
        if (buildQueue.length() == 0)
            return;

        //attempt to build the topmost one
        var top: CreepBuildData = buildQueue.top();
        var result = spawn.createCreep( top.body, top.name, top.memory );

        //if attempt was successful, remove it from build queue
        if (result == top.name) {
            buildQueue.pop();
            var scheduledCreeps = memory.centralMemory.scheduledCreeps;
            if (scheduledCreeps[top.name]) {
                delete scheduledCreeps[top.name];
            }
            memory.centralMemory.spawningCreeps[top.name] = spawn.name;
        }
    }

    static schedule(spawn: Spawn, creep: CreepBuildData, memory: IMemory): void {
        new Queue<CreepBuildData>(spawn.memory.strategyQueue).push(creep);
        memory.centralMemory.scheduledCreeps[creep.name] = spawn.name;
    }
}

//==============================================================================
class CreepUtils {
    public static isDead(name: string, game: IGame, memory: IMemory): boolean {
        return !CreepUtils.isFunctional(name, game) && !CreepUtils.isScheduled(name, memory) && !CreepUtils.isSpawning(name, memory);
    }
    public static isFunctional(name: string, game: IGame): boolean {
        return !(typeof game.creeps[name] === "undefined");
    }
    public static isScheduled(name: string, memory: IMemory): boolean {
        return !(typeof memory.centralMemory.scheduledCreeps[name] === "undefined");
    }
    public static isSpawning(name: string, memory: IMemory): boolean {
        return !(typeof memory.centralMemory.spawningCreeps[name] === "undefined");
    }


    static take(creep: Creep, object: any, objectType: string): void {
        var src = <HasPosition>object;
        if (creep.pos.isNearTo(src.pos.x, src.pos.y)) {
            var transfer = CreepUtils.transferDispatch.get()[objectType + "->Creep"];
            if (typeof transfer === "undefined")
                creep.say("Unable to take energy from type " + objectType);
            else
                transfer(src, creep);
        } else {
            creep.moveTo(object);
        }
    }

    static give(creep: Creep, object: any, objectType: string): void {
        var tgt = <HasPosition>object;
        if (creep.pos.isNearTo(tgt.pos.x, tgt.pos.y)) {
            var transfer = CreepUtils.transferDispatch.get()["Creep->" + objectType];
            if (typeof transfer === "undefined")
                creep.say("Unable to give enerty to type " + objectType);
            else
                transfer(creep, tgt);
        } else {
            creep.moveTo(object);
        }
    }

    static transferDispatch = new LazyValue<StringDictionary<(src: any, tgt: any) => void>>(
        function() {
            var res: StringDictionary<(src: any, tgt: any) => void> = {};
            var creepTransfer = function(src: any, tgt: any) { (<Creep>src).transfer(tgt, RESOURCE_ENERGY); };
            res["Creep->Creep"] = creepTransfer; 
            res["Creep->Spawn"] = creepTransfer;
            res["Source->Creep"] = function(src: any, tgt: any) { (<Creep>tgt).harvest(<Source>src); };
            return res;
        }
    );

    static createHarvestorData(energy: number, memory: IMemory): CreepBuildData {
        var body = CreepUtils.createBody(
            [MOVE, CARRY, WORK],
            [WORK, MOVE, 
                CARRY, WORK, WORK, MOVE, 
                CARRY, WORK, WORK, MOVE, 
                CARRY, WORK, WORK, MOVE,
                CARRY, WORK, WORK, MOVE
            ],
            energy
        );
        var name = "Creep" + MemoryUtils.uniqueNumber(memory);
        var creepMemory: CreepMemory = { 
            typeName: "Harvester",
            formation: "" 
        };
        return <CreepBuildData>{
            name: name,
            body: body,
            memory: creepMemory
        };
    }

    static createBody(
        minimumBody: Array<BODY_TYPE>,
        addOns: Array<BODY_TYPE>,
        energy: number
    ): Array<BODY_TYPE> {
        var result: Array<BODY_TYPE> = [];
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
    }

    static getBodyCost(bodyType: BODY_TYPE): number {
        var result = CreepUtils.bodyCosts.get()[bodyType.toString().valueOf()];
        if (typeof result === "undefined") {
            log.error("Could not find cost for body type " + bodyType.toString());
            return 0;
        }
        return result;
    }

    static bodyCosts = new LazyValue<StringDictionary<number>>(
        function(): StringDictionary<number> {
            var bodyTypesAndCosts: Array<PairData<BODY_TYPE, number>> = [
                {v1: MOVE,          v2: 50},
                {v1: WORK,          v2: 100},
                {v1: CARRY,         v2: 50},
                {v1: ATTACK,        v2: 80},
                {v1: RANGED_ATTACK, v2: 150},
                {v1: HEAL,          v2: 250},
                {v1: CLAIM,         v2: 600},
                {v1: TOUGH,         v2: 10}
            ];
            var result: StringDictionary<number> = {};
            for (var i = 0; i < bodyTypesAndCosts.length; ++i) {
                result[bodyTypesAndCosts[i].v1.toString().valueOf()] = bodyTypesAndCosts[i].v2;
            }
            return result;
        }
    );
}

//==============================================================================
interface FormationOps {
    typeName: string;
    execute(formation: Formation, game: IGame, memory: IMemory): void;
}

//==============================================================================
interface SupplyEndPoint {
    typeName: string;
    id: string;
    x: number;
    y: number;
}

interface SupplyChain extends Formation {
    sources: QueueData<SupplyEndPoint>;
    destination: SupplyEndPoint;
}

interface ISupplyChainOps extends FormationOps {
    createSupplyChain(
        creeps: Array<CreepBuildData>,
        sources: Array<SupplyEndPoint>, 
        destination: SupplyEndPoint,
        spawn: Spawn,
        game: IGame,
        memory: IMemory
    ): boolean;
}

var SupplyChainOps: ISupplyChainOps = {
    typeName: "SupplyChain",
    createSupplyChain(
        creeps: Array<CreepBuildData>,
        sources: Array<SupplyEndPoint>,
        destination: SupplyEndPoint,
        spawn: Spawn,
        game: IGame,
        memory: IMemory
    ): boolean { 
        var creepNames: Array<string> = [];
        var supplyChainName: string = "SupplyChain" + MemoryUtils.uniqueNumber(memory);
        for (var i = 0; i < creeps.length; ++i) {
            creeps[i].memory.formation = supplyChainName;
            creepNames.push(creeps[i].name);
            SpawnUtils.schedule(spawn, creeps[i], memory);
        }
        var supplyChain: SupplyChain = {
            name: supplyChainName,
            typeName: "SupplyChain",
            creeps: creepNames,
            sources: Queue.createFromArray<SupplyEndPoint>(sources),
            destination: destination
        };
        memory.centralMemory.formations[supplyChainName] = supplyChain;
        return true;
    },
    execute(formation: Formation, game: IGame, memory: IMemory): void {
        var supplyChain = <SupplyChain>formation;
        //remove all dead creeps from supplyChain
        supplyChain.creeps = ArrayUtils.filter<string>(
            supplyChain.creeps, 
            function(nm: string) { return !CreepUtils.isDead(nm, game, memory); }
        );

        //delete supplyChain if all creeps have died
        if (supplyChain.creeps.length == 0) {
            log.warn("Deleting formation " + formation.name + " because all creeps have died!");
            delete memory.centralMemory.formations[formation.name];
            return;
        }

        //find all functional creeps (already spawned)
        var creeps = ArrayUtils.filter<string>(
            supplyChain.creeps, 
            function(nm: string) { return CreepUtils.isFunctional(nm, game); }
        );

        //nothing to do if no function creeps
        if (creeps.length == 0) return;
        var sources = new Queue<SupplyEndPoint>(supplyChain.sources);
        for (var creepIdx = 0; creepIdx < creeps.length; ++creepIdx) {
            var creep: Creep = game.creeps[creeps[creepIdx]];
            if (creepIdx == 0
                && sources.length() > 0 
            && creep.carry.energy < creep.carryCapacity ) {
                //first creep needs to cycle through sources untill it's full.
                var nextSource = sources.top();
                CreepUtils.take(creep, game.getObjectById(nextSource.id), nextSource.typeName);
                if (creep.pos.isNearTo(nextSource.x, nextSource.y)) {
                    //if it's next to this source then cycle it to the back of the queue
                    sources.pop();
                    sources.push(nextSource);
                }
            } else if (creep.carry.energy < creep.carryCapacity) {
                //creep is not full, go to it's source
                var source: any = null;
                var sourceType: string = null;
                if (creepIdx == 0) {
                    //first creep: extract from source
                    //guaranteed only one source due to previous if condition
                    var sources = new Queue<SupplyEndPoint>(supplyChain.sources);
                    source = game.getObjectById(sources.top().id);
                    sourceType = sources.top().typeName;
                } else {
                    //source is previous creep
                    source = game.creeps[creeps[creepIdx - 1]];
                    sourceType = "Creep";
                }
                CreepUtils.take(creep, source, sourceType);
            } else {
                //creep is full: go to it's target
                var target: any = null;
                var targetType: string = null;
                if (creepIdx == creeps.length - 1) {
                    //last creep: target is destination
                    target = game.getObjectById(supplyChain.destination.id);
                    targetType = supplyChain.destination.typeName;
                } else {
                    //target is next creep
                    target = game.creeps[creeps[creepIdx + 1]];
                    targetType = "Creep";
                }
                CreepUtils.give(creep, target, targetType);
            }
        }
    }
}

//==============================================================================
class FormationUtils {
    //Do whatever the formation needs to do
    static execute(formation: Formation, game: IGame, memory: IMemory): void {
        FormationUtils.dispatch.get()[formation.typeName].execute(formation, game, memory);
    }

    //Get a FormationOps for a given formation type
    //usage: FormationUtils.dispatch.get()[typeName]
    static dispatch = new LazyValue<StringDictionary<FormationOps>>(
        function() {
            var allOps: Array<FormationOps> = [SupplyChainOps];
            var result: StringDictionary<FormationOps> = {};
            for( var i = 0; i < allOps.length; ++i ) {
                result[allOps[i].typeName] = allOps[i];
            }
            return result;
        }
    );
}

//==============================================================================
interface CreateHarvestorTask extends Task {
    spawnName: string;
    sourceId: string;
}

//==============================================================================
var CreateHarvestorTaskOps: TaskOps = {
    typeName: "CreateHarvestorTask",
    schedule(task: Task, game: IGame, memory:IMemory): boolean {
        var feTask = <CreateHarvestorTask>task;
        var spawn = game.spawns[feTask.spawnName];
        if (typeof spawn === "undefined") {
            log.error("CreateHarvestorTask: Unable to find spawn " + feTask.spawnName);
            return false;
        }
        var creepBuildData = CreepUtils.createHarvestorData(spawn.room.energyCapacityAvailable, memory);
        var source = <Source>game.getObjectById(feTask.sourceId);
        var sourceEndPoint: SupplyEndPoint = {
            typeName: "Source",
            id: source.id,
            x: source.pos.x,
            y: source.pos.y
        };
        var destinationEndPoint: SupplyEndPoint = {
            typeName: "Spawn",
            id: spawn.id,
            x: spawn.pos.x,
            y: spawn.pos.y
        }
        return SupplyChainOps.createSupplyChain(
            [creepBuildData],
            [sourceEndPoint],
            destinationEndPoint,
            spawn,
            game,
            memory
        );
    }
}

//==============================================================================
interface TaskOps {
    typeName: string;
    schedule(task: Task, game: IGame, memory: IMemory): boolean;
}

//==============================================================================
class TaskUtils {
    static schedule(t: Task, game: IGame, memory: IMemory): boolean {
        var ops: TaskOps = TaskUtils.dispatch.get()[t.typeName];
        if (typeof ops === "undefined") {
            log.error("Could not find TaskOps for task type " + t.typeName);
            return false;
        }
        return ops.schedule(t, game, memory);
    }
    
    static dispatch = new LazyValue<StringDictionary<TaskOps>>(
        function(): StringDictionary<TaskOps> {
            var allOps = [CreateHarvestorTaskOps];
            var result: StringDictionary<TaskOps> = {};
            for (var i = 0; i < allOps.length; ++i) {
                result[allOps[i].typeName] = allOps[i];
            }
            return result;
        }
    );
}

//==============================================================================
class StrategyUtils {
    static process(game: IGame, memory: IMemory): void {
        var processTask = function(t: Task): boolean { return !TaskUtils.schedule(t, game, memory); }
        if (memory.centralMemory.tactic.length > 0) {
            memory.centralMemory.tactic = ArrayUtils.filter<Task>(
                memory.centralMemory.tactic,
                processTask
            );
        } else {
            memory.centralMemory.strategy = ArrayUtils.filter<Task>(
                memory.centralMemory.strategy,
                processTask
            );
        }
    }
}

//==============================================================================
module.exports.loop = function() {
    log.debug("Main");

    //Analyse the current situation
    MemoryUtils.update(Game, Memory);

    StrategyUtils.process(Game, Memory);
    
    for (var spawnName in Game.spawns) {
        var spawn = Game.spawns[spawnName];
        SpawnUtils.process(spawn, Game, Memory);
    }

    for (var formationName in Memory.centralMemory.formations) {
        var formation = Memory.centralMemory.formations[formationName];
        FormationUtils.execute(formation, Game, Memory);
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

    testBTree: function(): void {
        var lt = function(l: String, r: String): boolean { 
            return parseInt(l.valueOf()) < parseInt(r.valueOf()); 
        }
        var maxPriority = function(pStore: Array<number>): number {
            var max = 0;
            for (var i = 0; i < pStore.length; ++i){
                max = Math.max(max, pStore[i]);
            }
            return max;
        }
        var priority = function(j: number): number {
            return j * (15 - j);
        }
        var btree: BTree<String, number> = BTree.emptyBTree<String, number>(lt);
        var priorities: Array<number> = [];
        assert(btree.isEmpty(), "Empty btree should have isEmpty set to true");
        assert(btree.isWellFormed(), "Empty btree should be well formed.");
        for (var i = 0; i < 20; ++i) {
            btree.insertOrUpdate(i.toString(), i, priority(i));
            priorities.push(priority(i));
            assert(btree.findMaxPriority().isDefined, "Max priority element should exist");
            assert(btree.findMaxPriority().get.priority == maxPriority(priorities), "Incorrect max priority");
            assert(!btree.isEmpty(), "Btree with " + i + " elements should not have isEmpty");
            assert(btree.isWellFormed(), "BTree with " + i + " elements should be well formed");
            for (var j = -5; j < 15; ++j ) {
                var findResult = btree.find(j.toString());
                assert(findResult.isDefined == (j >= 0 && j <= i), j + " should not be found after inserting [0, " + i + "].");
                if (findResult.isDefined) {
                    assert(findResult.get.key == j.toString(), "Found key should be searched key");
                    assert(findResult.get.value == j, "Found value should be correct");
                    assert(findResult.get.priority == priority(j), "Found priority should be correct");
                }
            }
        }

        btree = new BTree<String, number>(<BTreeData<String, number>>JSON.parse(JSON.stringify(btree.data)), lt);

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
            for (var j = -5; j < 15; ++j ) {
                var findResult = btree.find(j.toString());
                assert(findResult.isDefined == (j >= 0 && j <= 20 && (j % 4 != 0 || j == 0 || j > i)), "Find result.isDefined was " + findResult.isDefined + " when searching for " + j + " after deleting " + i);
                if (findResult.isDefined) {
                    assert(findResult.get.key == j.toString(), "Found key should be searched key");
                    assert(findResult.get.value == j, "Found value should be correct");
                    assert(findResult.get.priority == priority(j), "Found priority should be correct");
                }
            }
        }

        btree = new BTree<String, number>(<BTreeData<String, number>>JSON.parse(JSON.stringify(btree.data)), lt);

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
    if (error + failed > 0) finalStatus = "FAIL";
    console.log("============================================================");
    console.log('\n', finalStatus, "(tried: " + tried + ", passed: " + passed + ", failed: " + failed + ", errors: " + error + ")");
    process.exit(error + failed);
}
