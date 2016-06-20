/**
 * Created by hasee on 2016/6/20.
 */
module.exports = {
    entry:{
        animation:'./src/frameAnimation.js'
    },
    output:{
        path:__dirname+'/build',
        filename:'[name].js',
        library:'animation',
        libraryTarget:'umd'
    }


}