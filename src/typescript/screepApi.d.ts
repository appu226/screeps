//Stuff from the Game

declare interface BODY_TYPE { }
declare var WORK: BODY_TYPE;
declare var MOVE: BODY_TYPE;
declare var CARRY: BODY_TYPE;
declare var ATTACK: BODY_TYPE;
declare var RANGED_ATTACK: BODY_TYPE;
declare var HEAL: BODY_TYPE;
declare var TOUGH: BODY_TYPE;



declare interface Spawn {
    /** The amount of energy containing in the spawn. */
    energy: number;
    
    /** The total amount of energy the spawn can contain */
    energyCapacity: number;
    
    /**
     * Start the creep spawning process.
     * @param {Array<BODY_TYPE>} body - An array describing the new creep’s body. Should contain 1 to 50 elements.
     * @param {String} name (optional) - The name of a new creep. It should be unique creep name, i.e. the Game.creeps object should not contain another creep with the same name (hash key). If not defined, a random name will be generated.
     * @param {CreepMemory} memory (optional) - The memory of a new creep. If provided, it will be immediately stored into Memory.creeps[name].
     */
    createCreep: ((body: Array<BODY_TYPE>, name?: String, memory?: CreepMemory) => any);



}

declare interface Creep {
    say: (msg: String) => void
    memory: CreepMemory
}

declare interface GlobalMemory {
    creeps: any;
    spawns: any;
}

declare var Game: {
    getObjectById: (id: Number) => Object;
    spawns: any;
    creeps: any;
}


//Types i'm forced to declare for the way screep main is to be defined.
declare var module: any

//My own types, declared here for convenience.
declare interface QueueData<TElement> {
    popArray: Array<TElement>;
    pushArray: Array<TElement>;
}
declare interface CreepMemory {
}
declare interface SpawnMemory {
    buildQueue: QueueData<String>;
}