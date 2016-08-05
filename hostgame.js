function studentEngine(studentListDiv){
    // studentIOEngine
    var studentList={};
    var socIdToUuid={};
    this.missionObj=null;
    this.addStudent=function(socketId,studentName,uuid){
        socIdToUuid[socketId]=uuid;
        if(uuid in studentList){
            studentList[uuid].reConStudent(socketId);
        } else {
            var studentObj=new studentClass(socketId,studentName);
            studentList[uuid]=studentObj;
            studentListDiv.appendChild(studentObj.studentDiv);
        }
    }
    this.disConStudent=function(socketId){
        studentList[socIdToUuid[socketId]].disConStudent(socketId);
        delete(socIdToUuid[socketId]);
    }
    this.getConnectedStudents=function(){
        return socIdToUuid;
    }
    this.socIdToUuid=function(socketId){
        return socIdToUuid[socketId];
    }

    function studentClass(socketId,studentName){
        this.socketId=socketId;
        this.studentName=studentName;
        this.studentDiv=function(){
            var pDiv=document.createElement('button');
            $(pDiv).addClass("ui-btn ui-corner-all ui-icon-user ui-btn-icon-notext");
            pDiv.style="float:left; margin:1px 1px; background-size:300%";
            return pDiv;
        }();
        this.disConStudent=function(){
            this.socketId=null;
        }
        this.reConStudent=function(socketId){
            this.socketId=socketId;   
        }
    }
}


function ctrlBarEngine(prevBtn,resetBtn,nextBtn){
    (function init(){
        prevBtn.onclick=function(){lessonObj.prevQn();};
        nextBtn.onclick=function(){lessonObj.nextQn();};
        resetBtn.onclick=function(){lessonObj.resetQn();};
    })();
    this.hideNextBtn=function(){
        nextBtn.style="visibility:hidden;"
    }
    this.hidePrevBtn=function(){
        prevBtn.style="visibility:hidden;"
    }
    this.showNextBtn=function(){
        nextBtn.style="visibility:visible;"
    }
    this.showPrevBtn=function(){
        prevBtn.style="visibility:visible;"
    }
}

function interfaceHandler(titleDiv){

    this.windowLocation=function(href){
        window.location=href;
    }
    this.updateLessonId=function(lessonId){
        titleDiv.innerHTML="Lesson <font class='gameId'>"+lessonId+"</font>";
    }
    this.studentDisCon=function(studentSocketId){
        studentObj.disConStudent(studentSocketId);
    }
    
    this.relay=function(packet){
        console.log(packet);
        switch(packet.msg.title){
            case 'studentParams=':
                studentObj.addStudent(packet.socketId,packet.msg.studentName,packet.msg.uuid);
                socket.relay(packet.socketId,{"title":"qnCmd","jsFile":lessonObj.jsFile,"params":lessonObj.jsParams});
                break;
            case 'ans':
                lessonObj.processAns(packet.socketId,packet.msg.data);
        }
    }

}