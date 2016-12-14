function lessonEngine(qnStemDiv,studAnsDiv,lessonPlan){
    var baseJsAdd=
      "https://gabrielwu84.github.io/clicker-mods/";
    var qnNo=-1;
    var qnObj={};
    var answeredUuid;

    var studResp=[];
    
    this.jsFile;
    this.jsParams;

    (function init(){
        (function setupStudResp(){
            for(var qn in lessonPlan){
                studResp.push({});
            }
        })();
    })();

    this.nextQn=function(){
        qnNo++;
        answeredUuid={};// change structure from array to {studentUuid:ans} obj .
        var qnSpec=lessonPlan[qnNo];
        var jsFile=baseJsAdd+qnSpec.type+".js";
        execQn(jsFile,qnSpec.params,qnSpec.stem);
        navBtnLogic();
    }

    this.prevQn=function(){
        qnNo--;
        answeredUuid={};
        var qnSpec=lessonPlan[qnNo];
        var jsFile=baseJsAdd+qnSpec.type+".js";
        execQn(jsFile,qnSpec.params,qnSpec.stem);
        navBtnLogic();
    }
    this.resetQn=function(){
        answeredUuid={};
        var qnSpec=lessonPlan[qnNo];
        var jsFile=baseJsAdd+qnSpec.type+".js";
        execQn(jsFile,qnSpec.params,qnSpec.stem);
    }

    this.processAns=function(studentSocketId,studentAns){
        studentUuid=studentIoObj.socIdToUuid(studentSocketId);
        if(!(studentUuid in answeredUuid)){ // check student has not answered
            answeredUuid[studentUuid]=studentAns; 
            qnObj.procAns(studentUuid,studentAns);
            studentDispObj.markAnswered(studentUuid);
        } else {
            console.log(studentUuid+" already answered");
        }
    }

    function execQn(jsFile,jsParams,qnStem){
        lessonObj.jsFile=jsFile; 
        lessonObj.jsParams=jsParams;
        qnStemDiv.innerHTML=
            "<div class='ui-content'>"+qnStem+"</div>";
        studAnsDiv.innerHTML="";
        $.getScript(jsFile,function() {
            qnObj=new qnHostEng(qnStemDiv, studAnsDiv,jsParams);
            qnStemDiv.innerHTML+=qnObj.stemDisplay();
            $(qnStemDiv).trigger("create");
        });
        var students=studentIoObj.getConnectedStudents();
        for (var socketId in students){
            socket.relay(socketId,
                {"title":"qnCmd","jsFile":jsFile,"params":jsParams}
            );
        }
        studentDispObj.resetAnswered();
    }

    function navBtnLogic(){
        if(qnNo==lessonPlan.length-1){
            ctrlBarObj.hideNextBtn();
            // showEndButton()
        } else {
            ctrlBarObj.showNextBtn();
        }
        if(qnNo==0){
            ctrlBarObj.hidePrevBtn();
        } else {
            ctrlBarObj.showPrevBtn();
        }
    }
}

function studentIoEngine(){
    var studentList={};
    var socIdToUuid={};
    this.missionObj=null;
    this.addStudent=function(socketId,studentName,uuid){
        socIdToUuid[socketId]=uuid;
        if(uuid in studentList){
            studentList[uuid].reConStudent(socketId);
        	studentDispObj.markConnected(uuid);
        } else {
            var studentObj=new studentClass(socketId,studentName);
            studentList[uuid]=studentObj;
            studentDispObj.addStudent(uuid);
        }
    }
    this.disConStudent=function(socketId){
    	var uuid=socIdToUuid[socketId];
		studentList[uuid].disConStudent(socketId);
        studentDispObj.markDisconnected(uuid);
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
        this.disConStudent=function(){
            this.socketId=null;
        }
        this.reConStudent=function(socketId){
            this.socketId=socketId;   
        }
    }
}

function studentDisplayEngine(studentListDiv){
	var studentIcons={};
	this.addStudent=function(uuid){
		var studentIcon=new studentIconClass();
		studentListDiv.appendChild(studentIcon);
		studentIcons[uuid]=studentIcon;
	}
	function studentIconClass(){
		var sDiv=document.createElement('div');
		$(sDiv).addClass("studentIcon");
		$(sDiv).addClass("unanswered");
		return sDiv;
	}
	this.markAnswered=function(uuid){
		$(studentIcons[uuid]).removeClass("unanswered");
	}
	this.resetAnswered=function(){
        for(var uuid in studentIcons){
    		$(studentIcons[uuid]).addClass("unanswered");
        }
	}
	this.markDisconnected=function(uuid){
		$(studentIcons[uuid]).addClass("disconnected");
	}
	this.markConnected=function(uuid){
		$(studentIcons[uuid]).removeClass("disconnected");
	}
}

function ctrlBarEngine(prevBtn,resetBtn,nextBtn){
    (function init(){
        prevBtn.onclick=function(){lessonObj.prevQn();};
        nextBtn.onclick=function(){lessonObj.nextQn();};
        resetBtn.onclick=function(){lessonObj.resetQn();};
    })();
    this.hideNextBtn=function(){// showEndBtn
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
        studentIoObj.disConStudent(studentSocketId);
    }
    
    this.relay=function(packet){
        switch(packet.msg.title){
            case 'studentParams=':
                studentIoObj.addStudent(packet.socketId,packet.msg.studentName,packet.msg.uuid);
                socket.relay(packet.socketId,{"title":"qnCmd","jsFile":lessonObj.jsFile,"params":lessonObj.jsParams});
                break;
            case 'ans':
                lessonObj.processAns(packet.socketId,packet.msg.data);
        }
    }
}