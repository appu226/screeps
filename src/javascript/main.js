var ERROR_LEVEL;
(function (ERROR_LEVEL) {
    ERROR_LEVEL[ERROR_LEVEL["DEBUG"] = 0] = "DEBUG";
    ERROR_LEVEL[ERROR_LEVEL["INFO"] = 1] = "INFO";
    ERROR_LEVEL[ERROR_LEVEL["WARN"] = 2] = "WARN";
    ERROR_LEVEL[ERROR_LEVEL["ERROR"] = 3] = "ERROR";
})(ERROR_LEVEL || (ERROR_LEVEL = {}));
;
var globalErrLevel = ERROR_LEVEL.ERROR;
var myDebug = function (str, level = ERROR_LEVEL.INFO) {
    if (level > globalErrLevel)
        console.log(str);
};
class Queue {
    constructor(queueData_) {
        this.queueData = queueData_;
    }
    push(element) {
        this.queueData.pushArray.push(element);
    }
    transfer() {
        if (this.queueData.popArray.length == 0) {
            this.queueData.popArray = this.queueData.pushArray;
            this.queueData.popArray.reverse();
            this.queueData.pushArray = [];
        }
    }
    pop() {
        this.transfer();
        if (this.queueData.popArray.length == 0)
            return null;
        else
            return this.queueData.popArray.pop();
    }
    top() {
        if (this.queueData.popArray.length == 0)
            return null;
        else
            return this.queueData.popArray[this.queueData.popArray.length - 1];
    }
}
module.exports.loop = function () {
    myDebug("Main");
    for (var spawnId in Game.spawns) {
        var spawn = Game.spawns[spawnId];
        spawn.createCreep([WORK, CARRY, MOVE, MOVE]);
    }
};
