function lessonEngine(qnStemDiv,studAnsDiv,lessonPlan){
	var modJsAdd="https://gabrielwu84.github.io/clicker-mods/";
	//var modJsAdd="http://gabrielwu84.dlinkddns.com/home/proj-clicker/clicker-mods/";
	var qnNo=-1;
	var qnObj={};
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

	this.resetQn=function(){
		// may need to reroute this when adding direct qn nav btns, 
		// or open/close qn.
		studResp[qnNo]={};
		var qnSpec=lessonPlan[qnNo];
		var jsFile=modJsAdd+qnSpec.type+".js";
		execQn(jsFile,qnSpec.params,qnSpec.stem,studResp[qnNo]);
	}
	this.playQn=function(qId){
		if(qId>-1 && qId<lessonPlan.length){
			qnNo=qId;
			var qnSpec=lessonPlan[qnNo];
			var jsFile=modJsAdd+qnSpec.type+".js";
			execQn(jsFile,qnSpec.params,qnSpec.stem,studResp[qnNo]);
			ctrlBarObj.update(qnNo,lessonPlan,studResp);

		}else if(qId==-1){
			// end lesson. refactor into own function in future. 
			sessionStorage.setItem('studResp', studResp);
			window.location="end.html";
		}
	}

	this.processAns=function(studentSocketId,studentAns){
		studentUuid=studentIoObj.socIdToUuid(studentSocketId);
		if(!(studentUuid in studResp[qnNo])){ // check student has not answered
			studResp[qnNo][studentUuid]=studentAns; 
			qnObj.processAns(studentUuid,studentAns);
			studentDispObj.markAnswered(studentUuid);
		} else {
			console.log(studentUuid+" already answered");
		}
	}

	function execQn(jsFile,jsParams,qnStem,currResp){
		// sets up qnObj from mods
		lessonObj.jsFile=jsFile; 
		lessonObj.jsParams=jsParams;
		qnStemDiv.innerHTML=
			"<div class='ui-content'>"+qnStem+"</div>";
		studAnsDiv.innerHTML="";
		$.getScript(jsFile,function() {
			qnObj=new modWebEng(qnStemDiv,studAnsDiv,jsParams,initReadyCallback); 
			qnStemDiv.innerHTML+=qnObj.stemDisplay();
			$(qnStemDiv).trigger("create");
		});
		var students=studentIoObj.getConnectedStudents();
		// socketId and studentUuid is a bit complicated. see if can simplify - use only studentUuid
		for (var socketId in students){
			socket.relay(socketId,
				{"title":"qnCmd","jsFile":jsFile,"params":jsParams,"currAns":currResp[students[socketId]]}
			);
		}
		studentDispObj.resetAnswered(currResp);

		// for commands that are sensitive to synchronicity
		// e.g. processAns called needs qnObj to be initialized and graph to be ready
		// any way to remove need for initReadyCallback? Issues with jQuery initialize if this is used.
		function initReadyCallback(){
			// restore state from currResp
			for (var studentUuid in currResp){
				qnObj.processAns(studentUuid,currResp[studentUuid]);
			}
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
	this.resetAnswered=function(currResp){
		for(var uuid in studentIcons){
			$(studentIcons[uuid]).addClass("unanswered");
		}
		for(var studentUuid in currResp){
			$(studentIcons[uuid]).removeClass("unanswered");
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
		prevBtn.onclick=function(){lessonObj.playQn($(prevBtn).data('play-qid'));};
		nextBtn.onclick=function(){lessonObj.playQn($(nextBtn).data('play-qid'));};
		resetBtn.onclick=function(){lessonObj.resetQn();};
	})();
	this.update=function(qId,lessonPlan,studResp){
		if(qId==0){
			$(prevBtn).data('play-qid',qId-1);
			ctrlBarObj.hidePrevBtn();
		}else{
			$(prevBtn).data('play-qid',qId-1);
			ctrlBarObj.showPrevBtn();
		}
		if(qId==lessonPlan.length-1){
			$(nextBtn).data('play-qid',-1);
			ctrlBarObj.showEndBtn();
		}else{
			$(nextBtn).data('play-qid',qId+1);
			ctrlBarObj.showNextBtn();
		}
	}
	this.showEndBtn=function(){
		$(nextBtn).html("end");
	}
	this.hidePrevBtn=function(){
		prevBtn.style="visibility:hidden;"
	}
	this.showNextBtn=function(){
		$(nextBtn).html("next");
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