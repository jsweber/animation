/**
 * Created by hasee on 2016/6/19.
 */
'use strict';
var DEFAULT_INTERVAL = 1000/60;
//初始化状态
var STATE_INITIAL = 0;
//开始状态
var STATE_START =1;
//停止状态
var STATE_STOP = 2;

var requestAnimationFrame = (function(){
    var win = window;
    return win.requestAnimationFrame ||
            win.webkitRequestAnimationFrame ||
            win.mozRequestAnimationFrame ||
            win.oRequestAnimationFrame ||
            function (callback){
                return win.setTimeout(callback,callback.interval || DEFAULT_INTERVAL);
            }
})();

var cancelAnimationFrame = (function(){
    var win = window;
    return win.cancelRequestAnimationFrame ||
        win.webkitCancelRequestAnimationFrame ||
        win.mozCancelRequestAnimationFrame ||
        win.oCancelRequestAnimationFrame ||
        function (id){
            return win.clearTimeout(id);
        }
})();

function Timeline(){
    this.animationHandler = null;
    this.state = STATE_INITIAL;
}
/*
* 时间轴上每一次回调执行的函数
* @param time 从动画开始到当前执行的时间
* */
Timeline.prototype.onenterframe = function(time){}
/*
* 动画开始
* @param interval 每次回调的时间间隔
* */
Timeline.prototype.start = function(interval){
    if(this.state === STATE_START){return;}
    this.state = STATE_START;
    this.interval = interval || DEFAULT_INTERVAL;
    startTimeline(this, +new Date());
}

Timeline.prototype.stop = function(){
    if(this.state !== STATE_START){
        return;
    }
    this.state = STATE_STOP;
    if(this.starttime){
        this.dur = +new Date() - this.starttime;
    }
    cancelAnimationFrame(this.animationHandler);
}

Timeline.prototype.restart = function(){
    if(this.state === STATE_START){
        return;
    }
    if(!this.dur || !this.interval){
        return;
    }
    this.state = STATE_START;
    startTimeline(this,+new Date() - this.dur);
}
/*
* 时间轴动画启动函数
* @param timeline 时间轴的实例
* @param starttime 动画开始时间戳
* */
function startTimeline(timeline,starttime){
    timeline.starttime = starttime;
    nextTick.interval = timeline.interval;

    var prevTime = +new Date();
    nextTick();
    /*
    * 定义每一帧执行的函数
    * */
    function nextTick(){
        var nowTime = +new Date();

        timeline.animationHandler = requestAnimationFrame(nextTick);
        if(nowTime - prevTime >= timeline.interval){
            timeline.onenterframe(nowTime - starttime);
            prevTime = nowTime;
        }
    }
}

module.exports = Timeline;