(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["animation"] = factory();
	else
		root["animation"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Created by hasee on 2016/6/13.
	 */
	'use strict';
	/*
	* 帧动画库类
	* */
	var loadImage = __webpack_require__(1);
	var Timeline = __webpack_require__(2);

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
	        }):
	    this._runTask();
	}

	function next(callback){
	    callback && callback();
	}

	module.exports = function(){
	    return new Animation();
	}


/***/ },
/* 1 */
/***/ function(module, exports) {

	/**
	 * Created by hasee on 2016/6/13.
	 */
	'use strict';
	/*
	 * 预加载图片
	 * @param timeout 加载超时的时长
	 * */
	function loadImage(images,callback,timeout){
	    var win = window;
	    //加载完成图片的计数器
	    var count = 0;
	    //全部图片加载成功的标志
	    var success = true;
	    //超时timer的id
	    var timeroutId = null;
	    //是否加载超时的标志位
	    var isTimeout = false;

	    for(var key in images){
	        //过滤原型上的属性
	        if(!images.hasOwnProperty(key)){
	            continue;
	        }
	        var item = images[key];
	        //规范化images的格式{src:url}
	        if(typeof item=== 'string'){
	            item =  images[key] = { src:item };
	        }
	        if(!item || !item.src){
	            continue;
	        }
	        count++;

	        item.id = '__img__'+key+getId();
	        item.img = win[item.id] = new Image();
	        doLoad(item);
	    }
	    //遍历完成，发现是空数组
	    if(!count){
	        callback(success);
	    }else if(timeout){   //超时
	        timeroutId = setTimeout(timeoutFn,timeout);
	    }

	    function doLoad(item){
	        item.status = 'loading';
	        var img = item.img;
	        img.onload = function(){
	            success = success & true;
	            item.status = 'loaded';
	            done();
	        }
	        img.onerror = function(){
	            success = false;
	            item.status = 'error';
	            done();
	        }
	        img.src = item.src;

	        function done(){
	            img.onload = img.onerror = null;
	            try{
	                delete win[item.id];
	            }catch(e){}
	            //每张图片加载完成，计数器减一，当所有图片加载完成且没有超时的情况下，消除超时定时器
	            if(!--count && !isTimeout){
	                clearTimeout(timeroutId);
	                callback(success);
	            }
	        }
	    }

	    function timeoutFn(){
	        isTimeout = true;
	        callback(false);
	    }
	}
	var __id = 0;
	function getId(){
	    return ++__id;
	}

	module.exports = loadImage;

/***/ },
/* 2 */
/***/ function(module, exports) {

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

/***/ }
/******/ ])
});
;