var ERROR_LEVEL;
(function (ERROR_LEVEL) {
    ERROR_LEVEL[ERROR_LEVEL["DEBUG"] = 0] = "DEBUG";
    ERROR_LEVEL[ERROR_LEVEL["INFO"] = 1] = "INFO";
    ERROR_LEVEL[ERROR_LEVEL["WARN"] = 2] = "WARN";
    ERROR_LEVEL[ERROR_LEVEL["ERROR"] = 3] = "ERROR";
})(ERROR_LEVEL || (ERROR_LEVEL = {}));
;
var globalErrLevel = ERROR_LEVEL.ERROR;
var myDebug = function (str, level) {
    if (level === void 0) { level = ERROR_LEVEL.INFO; }
    if (level > globalErrLevel)
        console.log(str);
};
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
        if (this.queueData.popArray.length == 0)
            return null;
        else
            return this.queueData.popArray[this.queueData.popArray.length - 1];
    };
    return Queue;
})();
module.exports.loop = function () {
    myDebug("Main");
    for (var spawnId in Game.spawns) {
        var spawn = Game.spawns[spawnId];
        spawn.createCreep([WORK, CARRY, MOVE, MOVE]);
    }
};
