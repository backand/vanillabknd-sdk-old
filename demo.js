/***********************************************
 * backand JavaScript Library
 * Authors: backand
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 * Compiled At: 07/21/2015
 ***********************************************/
(function () {

    // init backand url
    backand.options.url = "https://api.backand.com:8080";

    var outputElement = null;
	var objectName = "items";

    var successCallback = function (data, status) {
        outputElement.innerText = '';
        outputElement.classList.remove('alert-danger');
        outputElement.classList.add('alert-success');
        if (data)
            outputElement.innerText = "status: " + status + "\n" + JSON.stringify(data);
        else
            outputElement.innerText = "status: " + status;
    };
    var errorCallback = function (error, status, message) {
		outputElement.innerText = '';
        outputElement.classList.remove('alert-success');
        outputElement.classList.add('alert-danger');
        outputElement.innerText = "status: " + status + "\n" + message;
    };

    var lastCreatedId = null;

    // LOGIN
    document.getElementById('oauth2-button').addEventListener('click', function() {
		outputElement = document.getElementById('oauth2-output');

        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        var appname = document.getElementById('appname').value;
        
        backand.security.signin(username, password, appname, successCallback, errorCallback);
	}, false);

        
    

    //CRUD
    //CRUD-READ-LIST
    document.getElementById('readMultiFilter-button').addEventListener('click', function() {		    
        outputElement = document.getElementById('readMultiFilter-output');


        var pageNumber = 1;
        var pageSize = 10;
        var filter = [{ fieldName: "name", operator: backand.filter.operator.text.startsWith, value: "a" }];
        var sort = [{ fieldName: "name", order: "desc" }];
        var search = null;
        var deep = true;

        backand.api.object.getList(objectName, false, false, pageNumber, pageSize, filter, sort, search, deep, successCallback, errorCallback);
    }, false);
	
    
	//CRUD-READ-ONE
    document.getElementById('readById-button').addEventListener('click', function() {
		outputElement = document.getElementById('readById-output');

		var id = lastCreatedId ? lastCreatedId : 1;
        
        backand.api.object.getOne(objectName, id, false, successCallback, errorCallback);
    }, false);
	
    //CRUD-CREATE
    document.getElementById('create-button').addEventListener('click', function() {
		outputElement = document.getElementById('create-output');

        var item = { "name": "good item", "description": "very good item" };

        backand.api.object.create(objectName, item, function (data, status) {
            lastCreatedId = data.__metadata.id;
            successCallback(data, status);
        }, errorCallback);
    }, false);
	
    //CRUD-UPDATE
    document.getElementById('update-button').addEventListener('click', function() {
		if (!lastCreatedId) {
            alert("please create before update");
            return;
        }
        outputElement = document.getElementById('update-output');
		
        var id = lastCreatedId;
        var item = { "name": "good item", "description": "excellent item" };

        backand.api.object.update(objectName, id, item, successCallback, errorCallback);
    });

    //CRUD-DELETE
    document.getElementById('delete-button').addEventListener('click', function() {
	    if (!lastCreatedId) {
            alert("please create before delete");
            return;
        }


        outputElement = document.getElementById('delete-output');
		
        var id = lastCreatedId;

        backand.api.object.delete(objectName, id, successCallback, errorCallback);
    });
})();