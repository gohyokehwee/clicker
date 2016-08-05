function socketHost(socketURL,interface){
    try{
        var socketCore=io.connect(socketURL);
    } catch(err){
        console.log(err);
        //interface.windowLocation('index.html?errmsg='+encodeURI(err));
    }

    socketCore.on('connectType?',function(){ 
        socketCore.emit('connectType=',{'type':'host'}); 
    }); 
    socketCore.on('newGameId=',function(lessonId){
        interface.updateLessonId(lessonId);
        interface.windowLocation("#host")
    });

    var shutdownmsg="";
    socketCore.on('serverShutDown',function(msg){
        shutdownmsg=msg;
    });
    socketCore.on('disconnect',function(msg){
        //interface.windowLocation('index.html?errmsg='+encodeURI(msg+'.'+shutdownmsg));
    });
    socketCore.on('ping',function(){
        socketCore.emit('pong',{beat:1}); 
    });

    socketCore.on('playerJoin',function(socketId){
    	socketCore.emit('relay',{'socketId':socketId,'msg':{'title':'studentParams?'}});
    });
    socketCore.on('playerQuit',function(socketId){
        interface.studentDisCon(socketId);
    });
    socketCore.on('relay',function(msg){
        interface.relay(msg);
    });
    this.relay=function(socketId,msg){
        socketCore.emit('relay',{'socketId':socketId,'msg':msg});
    }
}