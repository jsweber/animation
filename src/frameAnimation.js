/**
 * Created by hasee on 2016/6/13.
 */
'use strict';
/*
* 帧动画库类
* */
var loadImage = require('./imageloader.js');
var Timeline = require('./timeline.js');

//初始化状态
var STATE_INITIAL = 0;
//开始状态
var STATE_START =1;
//停止状态
var STATE_STOP = 2;
//同步任务
var TASK_SYNC = 0;
//异步任务
var TASK_ASYNC = 1;

function Animation(){
    this.taskQueue = [];
    this.index = 0;
    this.timeline = new Timeline();
    this.state = STATE_INITIAL;
}

Animation.prototype.loadImage = function(imglist){
    var taskFn = function(next){
        loadImage(imglist.slice(),next);//next回调函数
    }
    var type = TASK_SYNC;
    return this._add(taskFn,type);   //_add返回的是this，这样写一句顶两句，既返回了this也执行了_add
}
/*
* 添加一个异步定时任务，通过定时改变图片背景位置，实现帧动画
* @param ele dom 对象
* @param positions 背景位置数组
* @param imageUrl 图片地址
* */
Animation.prototype.changePosition = function(ele,positions,imageUrl){
    var self = this;
    var len = positions.length;
    var taskFn;
    var type;
    if(len){
        if(imageUrl){
            ele.style.backgroundImage = 'url('+imageUrl+')';
        }
        taskFn = function(next,time){
            //if(imageUrl){
            //    ele.style.backgroundImage = 'url('+imageUrl+')';
            //}
            var index = Math.min(time / self.interval | 0,len) - 1;  //     time / this.interval | 0 相当于 Math.floor(time / this.interval);  但是效率更好
            var position = positions[index].split(' ');
            ele.style.backgroundPosition = position[0]+'px '+position[1]+'px';
            if(index === len-1){
                next();
            }
        }
        type = TASK_ASYNC;
    }else{
        taskFn = next;
        type = TASK_SYNC;
    }
    return this._add(taskFn,type);

}

Animation.prototype.changeSrc = function(ele,imglist){
    var self = this;
    var len = imglist.length;
    var taskFn;
    var type;
    if(len){
        taskFn = function(next,time){
            var index =Math.min(time / self.interval | 0,len-1);
            ele.src = imglist[index];
            if(index === len-1){
                next();
            }
        }
        type = TASK_ASYNC;
    }else{
        taskFn = next;
        type = TASK_SYNC;
    }
    return this._add(taskFn,type);
}

/*
* 高级用法，添加一个异步定时执行的任务，
* 该任务自定义动画每帧的执行的任务函数
* @param taskFn 自定义每帧执行的任务函数
* */
Animation.prototype.enterFrame = function(taskFn){
    this._add(taskFn,TASK_ASYNC);
}

/*
* 添加一个同步任务，可以在上一个任务完成后执行回调
* */
Animation.prototype.then = function(callabck){
    var taskFn = function(next){
        callabck();
        next();
    }
    return this._add(taskFn,TASK_SYNC);
}

/*
* 设置间隔时间
* */
Animation.prototype.start = function(interval){
    if(this.state === STATE_START){
        return this;
    }
    if(!this.taskQueue.length){
        return this;
    }
    this.state = STATE_START;
    this.interval = interval;
    this._runTask();
    return this;
}

/*
* 添加一个同步任务，该任务就是回退到上一个任务中，
* 实现重复上一个任务的效果，可以定义重复的次数
* @param times 重复次数
*
* */
Animation.prototype.repeat = function(times){
    var self = this;
    var taskFn = function(next){
        if(typeof times === 'undefined'){
            self.index--;
            self._runTask();
            return;
        }
        if(times){
            times--;
            self.index--;
            self._runTask();
        }else{
            self._next(self.taskQueue[self.index]);
        }
    }
    return this._add(taskFn,TASK_SYNC);
}

/*
* 无限循环上一个任务
*
* */
Animation.prototype.repeatForever = function(){
    return this.repeat();
}

/*
* 设置当前任务执行结束到下一个任务开始前的等待时间
* */
Animation.prototype.wait = function(time){
    if(this.taskQueue && this.taskQueue.length>0){
        this.taskQueue[this.taskQueue.length-1].wait = time;
    }
    return this;
}

Animation.prototype.pause = function(){
    if(this.state === STATE_START){
        this.state = STATE_STOP;
        this.timeline.stop();
        return this;
    }
    return this;
}

Animation.prototype.restart = function(){
    if(this.state === STATE_STOP){
        this.state = STATE_START;
        this.timeline.restart();
        return this;
    }
    return this;
}

/*
* 释放资源
* */
Animation.prototype.dispose = function(){
    if(this.state !== STATE_INITIAL){
        this.state = STATE_INITIAL;
        this.timeline.stop();
        this.timeline = null;
        this.taskQueue = [];
        return this;
    }
    return this;
}

Animation.prototype._add = function(taskFn,type){
    this.taskQueue.push({
        taskFn:taskFn,
        type:type
    });
    return this;
}

Animation.prototype._runTask = function(){
    if(!this.taskQueue || this.state !== STATE_START){
        return;
    }
    if(this.index === this.taskQueue.length){
        this.dispose();
        return;
    }
    var task = this.taskQueue[this.index];
    if(task.type === TASK_SYNC){
        this._syncTask(task);
    }else{
        this._asyncTask(task);
    }
}
Animation.prototype._syncTask = function(task){
    var self = this;
    var next = function(){
        self._next(task);
    }
    task.taskFn(next);
}
Animation.prototype._asyncTask = function(task){
    var self = this;
    //重写每一帧的回调函数
    var enterFrame = function(time){
        var taskFn = task.taskFn;
        var next = function(){
            self.timeline.stop();
            self._next(task);
        }
        taskFn(next,time);
    }
    this.timeline.onenterframe = enterFrame;
    this.timeline.start(this.interval);
}
/*
* 切换到下一个任务，如果当前任务需要等待则延时执行
*@param 当前任务
* */
Animation.prototype._next = function(task){
    var self = this;
    this.index++;
    task.wait ?
        setTimeout(function(){
            self._runTask();
        },task.wait):
    this._runTask();
}

function next(callback){
    callback && callback();
}

module.exports = function(){
    return new Animation();
}
