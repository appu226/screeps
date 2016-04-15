//Stuff from the Game

interface BODY_TYPE { }
declare var WORK: BODY_TYPE;
declare var MOVE: BODY_TYPE;
declare var CARRY: BODY_TYPE;
declare var ATTACK: BODY_TYPE;
declare var RANGED_ATTACK: BODY_TYPE;
declare var HEAL: BODY_TYPE;
declare var CLAIM: BODY_TYPE;
declare var TOUGH: BODY_TYPE;

interface RESULT_CODE { }
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


interface RESOURCE_CODE { }
declare var RESOURCE_ENERGY: RESOURCE_CODE;
declare var RESOURCE_POWER: RESOURCE_CODE;
declare var RESOURCES_ALL: Array<RESOURCE_CODE>;

interface STRUCTURE_TYPE { }
declare var STRUCTURE_EXTENSION: STRUCTURE_TYPE; // extension"
declare var STRUCTURE_RAMPART: STRUCTURE_TYPE; // rampart"
declare var STRUCTURE_ROAD: STRUCTURE_TYPE; // road"
declare var STRUCTURE_SPAWN: STRUCTURE_TYPE; // spawn"
declare var STRUCTURE_LINK: STRUCTURE_TYPE; // link"
declare var STRUCTURE_WALL: STRUCTURE_TYPE; // constructedWall"
declare var STRUCTURE_KEEPER_LAIR: STRUCTURE_TYPE; // keeperLair"
declare var STRUCTURE_CONTROLLER: STRUCTURE_TYPE; // controller"
declare var STRUCTURE_STORAGE: STRUCTURE_TYPE; // storage"
declare var STRUCTURE_TOWER: STRUCTURE_TYPE; // tower"
declare var STRUCTURE_OBSERVER: STRUCTURE_TYPE; // observer"
declare var STRUCTURE_POWER_BANK: STRUCTURE_TYPE; // powerBank"
declare var STRUCTURE_POWER_SPAWN: STRUCTURE_TYPE; // powerSpawn"


interface FIND_CONSTANT { }

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

interface DIRECTION_CONSTANT { }
declare var TOP: DIRECTION_CONSTANT;
declare var TOP_RIGHT: DIRECTION_CONSTANT;
declare var RIGHT: DIRECTION_CONSTANT;
declare var BOTTOM_RIGHT: DIRECTION_CONSTANT;
declare var BOTTOM: DIRECTION_CONSTANT;
declare var BOTTOM_LEFT: DIRECTION_CONSTANT;
declare var LEFT: DIRECTION_CONSTANT;
declare var TOP_LEFT: DIRECTION_CONSTANT;

interface HasPosition {
    pos: RoomPosition;
    room: Room;
}

interface Structure extends HasPosition, CreepOrStructure {
    id: string;
    name: string;
    structureType: STRUCTURE_TYPE;
    hits: number;
    hitsMax: number;
}

interface ConstructionSite extends HasPosition {
    id: string;
    name: string;
    /**
     * The current construction progress.
     */
    progress: number;
    
    /**
     * The total construction progress needed for the structure to be built.
     */
    progressTotal: number;
    
    /**
     * One of the STRUCTURE_* constants.
     */
    structureType: STRUCTURE_TYPE;

}

interface RoomPosition {
    roomName: string;
    x: number;
    y: number;
    
    /**
     * Find an object with the shortest linear distance from the given position.
     */
    findClosestByRange: (type: FIND_CONSTANT, opts?: any) => any;

    /**
     * Find an object with the shortest path from the given position. 
     * Uses A* search algorithm and Dijkstra's algorithm.
     *
     * Arguments
     *   type
     *     number
     *     See Room.find.
     *
     *   objects
     *     array
     *     An array of room's objects or RoomPosition objects that the search should be executed against.
     *
     *   opts (optional)
     *   object
     *   An object containing pathfinding options (see Room.findPath), or one of the following:
     *     filter
     *         object, function, string
     *         Only the objects which pass the filter using the Lodash.filter method will be used.
     *     algorithm
     *         string
     *         One of the following constants:
     *             astar is faster when there are relatively few possible targets;
     *             dijkstra is faster when there are a lot of possible targets or 
     *             when the closest target is nearby.
     *         The default value is determined automatically using heuristics.
     *
     * Return value
     *   The closest object if found, null otherwise.
     */
    findClosestByPath: (type: FIND_CONSTANT, opts?: any) => any;

    /**
     * Find all objects in the specified linear range.
     * Arguments
     *   type: FIND_CONSTANT
     *     See Room.find.
     *   range: number
     *     The range distance.
     *   opts: (optional) object
     *     See Room.find.
     * 
     * Return value
     *   An array with the objects found.
     */
    findInRange: (type: FIND_CONSTANT, range: number, opts?: { filter: any } ) => Array<any>;

    /**
     * Find an optimal path to the specified position using A* search algorithm. 
     *   This method is a shorthand for Room.findPath. 
     *   If the target is in another room, then the corresponding exit will be used as a target.
     * 
     * Arguments
     *   x
     *     number
     *     X position in the room.
     *   y
     *     number
     *     Y position in the room.
     *   target
     *     object
     *     Can be a RoomPosition object or any object containing RoomPosition.
     *   opts (optional)
     *     object
     *     An object containing pathfinding options flags (see Room.findPath for more details).
     *
     * Return value
     *   An array with path steps.
     */
    findPathTo: (target: HasPosition, opts?: any) => Array<Step>;

    /**
     * Get linear range to the specified position.
     */
    getRangeTo: (x: number, y: number) => number;

    /**
     * Get linear direction to the specified position.
     */
    getDirectionTo: ( x: number, y:number ) => DIRECTION_CONSTANT;

    /**
     * Check whether this position is on the adjacent square to the specified position. 
     * The same as inRangeTo(target, 1).
     */
    isNearTo: (x: number, y: number) => boolean

    /**
     * Get an object with the given type at the specified room position.
     * 
     * Arguments: One of the following string constants:
     * constructionSite
     * creep
     * exit
     * flag
     * resource
     * source
     * structure
     * terrain
     *
     * Returns: An array of objects of the given type at the specified position if found.
     */
    lookFor: (objectType: string) => Array<any>;
}

interface Controller extends Structure {
    /**
     * Current controller level, from 0 to 8.
     */
    level: number;
}

interface Room {
    /**
     * The Controller structure of this room, if present, otherwise undefined.
     */
    controller: Controller;

    /**
     * Total amount of energyCapacity of all spawns and extensions in the room.
     */
    energyCapacityAvailable: number;

    /**
     * Find all objects of the specified type in the room.
     *
     * opts (optional) object
     *   An object with additional options:
     *     filter:  object, function, string
     *       The result list will be filtered using the Lodash.filter method.
     */
    find: ( type: FIND_CONSTANT, opts?: { filter: any } ) => Array<any>;

    /**
     * Creates a RoomPosition object at the specified location.
     */
    getPositionAt: ( x: number, y: number ) => RoomPosition;

    /**
     * Get an object with the given type at the specified room position
     * http://screeps.wikia.com/wiki/LookAt
     */
    lookForAt: ( type: string, x: number, y: number ) => Array<any>;

    /**
     * The name of the room.
     */
    name: string;
}

interface Spawn extends HasPosition {
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
    id: string;

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
    name: string;
    
    /**
     * If the spawn is in process of spawning a new creep, 
     * this object will contain the new creep’s information, 
     * or null otherwise.
     */
    spawning: { name: string, needTime: number, remainingTime: number };

}

interface Step {
    x: number;
    y: number;
    dx: number;
    dy: number;
    direction: DIRECTION_CONSTANT;
}

interface CreepOrStructure { }

interface Creep extends HasPosition, CreepOrStructure {
    /**
     * Display a visual speech balloon above the creep 
     * with the specified message. 
     * The message will disappear after a few seconds. 
     * Useful for debugging purposes. 
     * Only the creep's owner can see the speech message.
     */
    say: (msg: string) => void;
    
    /**
     * A shorthand to Memory.creeps[creep.name]. 
     * You can use it for quick access the creep’s specific memory data object. 
     * Note: you can't access the memory property of the creep object 
     * which has been just scheduled to spawn, 
     * but you still can write its memory like that.
     */
    memory: CreepMemory;
   
    /**
     * An array describing the creep’s body.
     */
    body: Array<{type: BODY_TYPE, hits: number }>;
    
    /**
     * Build a structure at the target construction site using carried energy. 
     * Needs WORK and CARRY body parts. 
     * The target has to be within 3 squares range of the creep.
     */
    build: (target: ConstructionSite) => RESULT_CODE;
    
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
     * Get the quantity of live body parts of the given type. Fully damaged parts do not count.
     */
    getActiveBodyparts: ( body_type: BODY_TYPE ) => number;
    
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
    id: string;

    /**
     * Move the creep one square in the specified direction. Requires the MOVE body part.
     */
    move: ( direction: DIRECTION_CONSTANT ) => RESULT_CODE;
    
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
    name: string;
    
    /**
     * An object with the creep’s owner info containing the following properties:
     * username: String: The name of the owner user.
     */
    owner: { username: string }

    /**
     * A ranged attack against another creep or structure. 
     * Requires the RANGED_ATTACK body part. 
     * If the target is inside a rampart, the rampart is attacked instead. 
     * The target has to be within 3 squares range of the creep.
     */
    rangedAttack: ( target: any ) => void;

    /**
     * A ranged attack against all hostile creeps or structures within 3 squares range. 
     * Requires the RANGED_ATTACK body part. 
     * The attack power depends on the range to each target. 
     * Friendly units are not affected.
     */
    rangedMassAttack: () => void;
    
    /**
     * Repair a damaged structure using carried energy. 
     * Needs the WORK and CARRY body parts. 
     * The target has to be within 3 squares range of the creep.
     */
    repair: (target: any) => RESULT_CODE;

    /**
     * Whether this creep is still being spawned.
     */
    spawning: boolean;
    
    /**
     * The remaining amount of game ticks after which the creep will die.
     */
    ticksToLive: number;
    
    /**
     * Transfer resource from the creep to another object. 
     * The target has to be at adjacent square to the creep.
     */
    transfer: (target: CreepOrStructure, resourceType: RESOURCE_CODE, amount?: number) => RESULT_CODE

    /**
     * Upgrade your controller to the next level using carried energy. 
     * Upgrading controllers raises your Global Control Level in parallel. 
     * Needs WORK and CARRY body parts. 
     * The target has to be at adjacent square to the creep. 
     * A fully upgraded level 8 controller can't be upgraded 
     * with the power over 15 energy units per tick 
     * regardless of creeps power. 
     * The cumulative effect of all the creeps performing upgradeController
     * in the current tick is taken into account.
     */
    upgradeController: (target: Controller) => RESULT_CODE;

}


interface Source extends Structure {

    /**
     * The remaining amount of energy.
     */
    energy: number;

    /**
     * The total amount of energy in the source.
     */
    energyCapacity: number;
    
}


//Global objects
interface IMemory{
    creeps: StringDictionary<CreepMemory>;
    spawns: StringDictionary<SpawnMemory>;
    centralMemory: CentralMemory;
}

declare var Memory: IMemory;

interface IGame {
    creeps: StringDictionary<Creep>;
    gcl: {
        level: number;
        progress: number;
        progressTotal: number;
    };
    getObjectById: (id: string) => any;
    rooms: StringDictionary<Room>;
    spawns: StringDictionary<Spawn>;
    time: number;
}

declare var Game: IGame;


//Types i'm forced to declare for the way screep main is to be defined.
declare var module: any

//Serializable data types
interface Option<TElement> {
    isDefined: boolean;
    get: TElement;
}

interface StringDictionary<TElement> {
    [key: string]: TElement;
}

interface QueueData<TElement> {
    popArray: Array<TElement>;
    pushArray: Array<TElement>;
}

interface PairData<T1, T2> {
    v1: T1;
    v2: T2;
}

interface BTreeValueData<TKey, TValue> {
    key: TKey;
    value: TValue;
    priority: number;
}

interface BTreeData<TKey, TValue> {
    isLeaf: boolean;
    isRoot: boolean;
    isEmpty: boolean;
    size: number;
    maxPriority: number;
    values: Array<BTreeValueData<TKey, TValue>>;
    children: Array<BTreeData<TKey, TValue>>;
}

//Memory objects
interface CreepBuildData {
    name: string;
    body: Array<BODY_TYPE>;
    memory: CreepMemory;
}

interface SpawnMemory {
    tacticQueue: BTreeData<string, CreepBuildData>;
    strategyQueue: BTreeData<string, CreepBuildData>;
}

interface CreepMemory {
    typeName: string;
    formation: string;
}

interface Task {
    typeName: string;
}

interface Formation {
    name: string;
    typeName: string;
    isMilitary: boolean;
}

interface CentralMemory {
    strategy: Array<Task>;
    tactic: Array<Task>;
    formations: StringDictionary<Formation>;
    idleCreeps: Array<string>;
    scheduledCreeps: StringDictionary<string>; //map from creep name to spawn name
    spawningCreeps: StringDictionary<string>;
    uniqueCounter: number;
    startingTime: number;
}
