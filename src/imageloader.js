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