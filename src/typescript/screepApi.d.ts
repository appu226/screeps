//Stuff from the Game

declare interface BODY_TYPE { }
declare var WORK: BODY_TYPE;
declare var MOVE: BODY_TYPE;
declare var CARRY: BODY_TYPE;
declare var ATTACK: BODY_TYPE;
declare var RANGED_ATTACK: BODY_TYPE;
declare var HEAL: BODY_TYPE;
declare var TOUGH: BODY_TYPE;

declare interface RESULT_CODE { }
declare var OK: RESULT_CODE;
declare var ERR_NOT_OWNER;
declare var ERR_NO_PATH;
declare var ERR_NAME_EXISTS;
declare var ERR_BUSY;
declare var ERR_NOT_FOUND;
declare var ERR_NOT_ENOUGH_RESOURCES;
declare var ERR_INVALID_TARGET;
declare var ERR_FULL;
declare var ERR_NOT_IN_RANGE;
declare var ERR_INVALID_ARGS;
declare var ERR_TIRED;
declare var ERR_NO_BODYPART;
declare var ERR_NOT_ENOUGH_EXTENSIONS;
declare var ERR_RCL_NOT_ENOUGH;
declare var ERR_GCL_NOT_ENOUGH;


declare interface RESOURCE_CODE { }
declare var RESOURCE_ENERGY: RESOURCE_CODE;
declare var RESOURCE_POWER: RESOURCE_CODE;
declare var RESOURCES_ALL: Array<RESOURCE_CODE>;

declare interface FIND_CONSTANT { }

declare var FIND_CREEPS: FIND_CONSTANT;
declare var FIND_MY_CREEPS: FIND_CONSTANT;
declare var FIND_HOSTILE_CREEPS: FIND_CONSTANT;
declare var FIND_MY_SPAWNS: FIND_CONSTANT;
declare var FIND_HOSTILE_SPAWNS: FIND_CONSTANT;
declare var FIND_SOURCES: FIND_CONSTANT;
declare var FIND_SOURCES_ACTIVE: FIND_CONSTANT;
declare var FIND_DROPPED_RESOURCES: FIND_CONSTANT;
declare var FIND_STRUCTURES: FIND_CONSTANT;
//(Note: walls and roads cannot be found using this constant 
//as they have no owner, use FIND_STRUCTURES instead)
declare var FIND_MY_STRUCTURES: FIND_CONSTANT;
declare var FIND_HOSTILE_STRUCTURES: FIND_CONSTANT;
declare var FIND_FLAGS: FIND_CONSTANT;
declare var FIND_CONSTRUCTION_SITES: FIND_CONSTANT;
declare var FIND_MY_CONSTRUCTION_SITES: FIND_CONSTANT;
declare var FIND_HOSTILE_CONSTRUCTION_SITES: FIND_CONSTANT;
declare var FIND_EXIT_TOP: FIND_CONSTANT;
declare var FIND_EXIT_RIGHT: FIND_CONSTANT;
declare var FIND_EXIT_BOTTOM: FIND_CONSTANT;
declare var FIND_EXIT_LEFT: FIND_CONSTANT;
declare var FIND_EXIT: FIND_CONSTANT;



declare interface HasPosition {
    pos: RoomPosition;
    room: Room;
}

declare interface Structure extends HasPosition {
}

declare interface RoomPosition {
    roomName: String
    x: number
    y: number
    
    /**
     * Find an object with the shortest linear distance from the given position.
     */
    findClosestByRange: (type: FIND_CONSTANT, opts?: any) => any;
}

declare interface Controller extends Structure {
    /**
     * Current controller level, from 0 to 8.
     */
    level: number;
}

declare interface Room {
    /**
     * The Controller structure of this room, if present, otherwise undefined.
     */
    controller: Controller;
}

declare interface Spawn extends HasPosition {
    /**
     * Start the creep spawning process.
     * @param {Array<BODY_TYPE>} body - An array describing the new creep’s body. Should contain 1 to 50 elements.
     * @param {String} name (optional) - The name of a new creep. It should be unique creep name, i.e. the Game.creeps object should not contain another creep with the same name (hash key). If not defined, a random name will be generated.
     * @param {CreepMemory} memory (optional) - The memory of a new creep. If provided, it will be immediately stored into Memory.creeps[name].
     */
    createCreep: ((body: Array<BODY_TYPE>, name?: String, memory?: CreepMemory) => any);
    
    /** The amount of energy containing in the spawn. */
    energy: number;
    
    /** The total amount of energy the spawn can contain */
    energyCapacity: number;
    
    /** A unique object identificator. 
     * You can use Game.getObjectById method to retrieve an object instance 
     * by its id. 
    */
    id: String;

    /**
     * A shorthand to Memory.spawns[spawn.name].
     * You can use it for quick access the spawn’s 
     * specific memory data object.
     */
    memory: SpawnMemory;
    
    /**
     * Spawn’s name. 
     * You choose the name upon creating a new spawn, 
     * and it cannot be changed later. 
     * This name is a hash key to access the spawn via the Game.spawns object.
     */
    name: String;
    
    /**
     * If the spawn is in process of spawning a new creep, 
     * this object will contain the new creep’s information, 
     * or null otherwise.
     */
    spawning: { name: String, needTime: number, remainingTime: number };

}

declare interface Creep extends HasPosition {
    /**
     * Display a visual speech balloon above the creep 
     * with the specified message. 
     * The message will disappear after a few seconds. 
     * Useful for debugging purposes. 
     * Only the creep's owner can see the speech message.
     */
    say: (msg: String) => void
    
    /**
     * A shorthand to Memory.creeps[creep.name]. 
     * You can use it for quick access the creep’s specific memory data object. 
     * Note: you can't access the memory property of the creep object 
     * which has been just scheduled to spawn, 
     * but you still can write its memory like that.
     */
    memory: CreepMemory
    
    /**
     * An object with the creep's cargo contents:
     */
    carry: {
        /**
         * The amount of energy resource units.
         */
        energy: number;
        
        /**
         * The amount of power resource units if present, undefined otherwise.
         */
        power: number;
    };
    
    /**
     * The total amount of resources the creep can carry.
     */
    carryCapacity: number;
    
    /**
     * Harvest energy from the source. 
     * Needs the WORK body part. 
     * If the creep has an empty CARRY body part, 
     * the harvested energy is put into it; 
     * otherwise it is dropped on the ground. 
     * The target has to be at an adjacent square to the creep.
     */
    harvest: (source: Source) => RESULT_CODE;
    
    /**
     * A unique object identificator. 
     * You can use Game.getObjectById method to retrieve 
     * an object instance by its id.
     */
    id: String;
    
    /**
     * Find the optimal path to the target within the same room 
     * and move to it. 
     * A shorthand to consequent calls of pos.findPathTo() 
     * and move() methods. 
     * If the target is in another room, 
     * then the corresponding exit will be used as a target. 
     * Needs the MOVE body part.
     */
    moveTo: (rp: RoomPosition) => RESULT_CODE;
    
    /**
     * Creep’s name. 
     * You can choose the name while creating a new creep, 
     * and it cannot be changed later. 
     * This name is a hash key to access the creep via the Game.creeps object.
     */
    name: String;
    
    /**
     * The remaining amount of game ticks after which the creep will die.
     */
    ticksToLive: number;
    
    /**
     * Transfer resource from the creep to another object. 
     * The target has to be at adjacent square to the creep.
     */
    transfer: (target: Structure, resourceType: RESOURCE_CODE, amount?: number) => RESULT_CODE

}


declare interface Source extends Structure {

}

declare interface CentralMemory {
    idleSpawnNames: QueueData<String>;
    ageingCreeps: QueueData<String>;
}

declare var Memory: {
    creeps: any;
    spawns: any;
    centralMemory: CentralMemory;
}

declare var Game: {
    creeps: any;
    gcl: {
        level: number;
        progress: number;
        progressTotal: number;
    };
    getObjectById: (id: String) => any;
    spawns: any;
}


//Types i'm forced to declare for the way screep main is to be defined.
declare var module: any

//My own types, declared here for convenience.
declare interface QueueData<TElement> {
    popArray: Array<TElement>;
    pushArray: Array<TElement>;
}
declare interface ConstructorData {
    createdType: String;
}
declare interface CreepBehaviorData extends ConstructorData { }
declare interface CreepActionData extends ConstructorData { }

declare interface SpawnMemory {
    buildQueue: QueueData<CreepBehaviorData>;
}

declare interface CreepMemory {
    spawnId: String;
    defaultBehavior: CreepBehaviorData;
    actionOverride: QueueData<CreepActionData>;
}