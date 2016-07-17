/***********************************************
 * backand JavaScript Library
 * Authors: backand
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 * Compiled At: 07/21/2015
 ***********************************************/
var BKStorage = (function () {
    'use strict';

    var prefix = 'BACKAND';

    function Store (storeName, type) {

        var storageAPI;

        if( ['local', 'session'].indexOf(type) === -1 ) type = 'local';

        if (typeof window !== 'undefined' && typeof window[type + 'Storage'] !== 'undefined') {
            storageAPI = window[type + 'Storage'];
        } else {
            // We can fallback to other solution here inMemory Management
            // It could be cookies if needed
            storageAPI = {
                value: null,
                getItem: function (name, params) {
                    return this.value;
                },
                setItem: function (name, params) {
                    this.value = params;
                },
                removeItem: function (name, params) {
                    this.value = null;
                }
            };
        }

        this.command = function (action, params) {
            return storageAPI[action + 'Item'](prefix + storeName, params || null);
        };
    }

    Store.prototype.get = function () {
        return JSON.parse(this.command('get'));
    };

    Store.prototype.set = function (value) {
        return this.command('set', JSON.stringify(value));
    };

    Store.prototype.clear = function () {
        this.command('set');
        return this;
    };

    return {
        register: function (storeName, type) {
            if(!storeName) {
                throw Error('Invalid Store Name');
            }
            this[storeName] = new Store(storeName, type);
            return this;
        },

        remove: function (storeName) {
            this[storeName].command('remove');
            delete this[storeName];
            return this;
        }
    };

})();
 
var backand = {
    /* initiate app and user security tokens */
    options: {
        url: 'https://api.backand.com',
        version: '1',
        getUrl: function (apiUrl) {
            return this.url + '/' + this.version + apiUrl;
        },
        getQueryString: function(){
            return window.location.href.slice(window.location.href.indexOf('?') + 1);
        },
        objectToQueryString: function (obj) {
            var str = [];
            for (var p in obj)
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
        },
        /* general ajax call for backand rest api */
        ajax: {
            json: function (url, data, verb, successCallback, errorCallback, forToken) {
				var xmlhttp;

				if (window.XMLHttpRequest) {
					// code for IE7+, Firefox, Chrome, Opera, Safari
					xmlhttp = new XMLHttpRequest();
				} else {
					// code for IE6, IE5
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				}
				
				
				
				xmlhttp.onreadystatechange = function() {
					if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
					   if(xmlhttp.status == 200){
						   if (successCallback) successCallback(xmlhttp.responseText ? JSON.parse(xmlhttp.responseText) : '', xmlhttp.status, xmlhttp);
					   }
					   else {
						   if (errorCallback) errorCallback(xmlhttp, xmlhttp.status, xmlhttp.responseJSON && xmlhttp.responseJSON.error_description ? xmlhttp.responseJSON.error_description : xmlhttp.responseText);
					   }
					}
				};

				xmlhttp.open(verb, url, true);

				if (forToken){
					// OAuth 2 get token form standard
					data = "grant_type=password&appname=" + data.appname + "&username=" + data.username + "&password=" + data.password;
					xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				}
				else{
					data = JSON.stringify(data);
					xmlhttp.setRequestHeader('Authorization', backand.security.getToken());
				}
				
				xmlhttp.send(data);
				
			},
            file: function (url, data, verb, successCallback, erroCallback) {

            }
        },
        verbs: { get: "GET", put: "PUT", post: "POST", delete: "DELETE" }
    },
    security: {
		url: "/token",
		getToken: function () {
			backand.security.initStorage();
			return BKStorage.token.get();
		},
		initStorage: function(){
			if (!BKStorage.token){
				BKStorage.register('token');
			}
			if (!BKStorage.user){
				BKStorage.register('user');
			}
		},
		onsignin: null,
		addSigninEvent: function (appname) {
			if (backand.security.onsignin !== null) return;
			// Create the event
			if (window.navigator.userAgent.indexOf("MSIE ") > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./) || window.navigator.userAgent.indexOf("Safari") > 0) {
				backand.security.onsignin = document.createEvent("CustomEvent");
				backand.security.onsignin.initCustomEvent('onsignin', false, false, { "appname": appname });
			}
			else {
				backand.security.onsignin = new CustomEvent("onsignin", { "appname": appname });
			}
		},
		signout: function(){
			backand.security.initStorage();
			BKStorage.token.clear();
			BKStorage.user.clear();
		},
		signin: function (username, password, appname, successCallback, errorCallback) {
			backand.security.addSigninEvent();
			backand.options.ajax.json(backand.options.url + backand.security.url, { grant_type: "password", username: username, password: password, appname: appname }, backand.options.verbs.post, function (data, status) {
					var token = data.token_type + " " + data.access_token;
					backand.security.initStorage();
					BKStorage.token.set(token);
					BKStorage.user.set(data);
					document.dispatchEvent(backand.security.onsignin);
					if (successCallback) successCallback(data, status);
				},
				function (xhr, textStatus, err) {
					if (errorCallback && xhr) errorCallback(xhr, textStatus, err)
				},
				true);
		}
    },
    api: {
        /* object contains the information about a database table */
        object: {
            config: {
                url: '/object/config/',
                /* get the configuration information of the object such as object name, columns names and columns types */
                getItem: function (name, successCallback, errorCallback) {
                    var url = backand.options.getUrl(backand.api.object.config.url + name);
                    backand.options.ajax.json(url, null, backand.options.verbs.get, successCallback, errorCallback);
                },
                getList: function (withSelectOptions, pageNumber, pageSize, filter, sort, search, successCallback, errorCallback) {
                    var url = backand.options.getUrl(backand.api.object.config.url);
                    var data = {
                        withSelectOptions: withSelectOptions,
                        pageNumber: pageNumber,
                        pageSize: pageSize,
                        filter: JSON.stringify(filter),
                        sort: JSON.stringify(sort),
                        search: search
                    };
                    backand.options.ajax.json(url, data, backand.options.verbs.get, successCallback, errorCallback);

                }
            },
            /* get the object data */
            action: {
                url: '/objects/action/',
                /* get a single row by the primary key (id) */
                get: function (objectName, actionName, parameters, successCallback, errorCallback) {
                    var url = backand.options.getUrl(backand.api.object.action.url + name);
                    var data = {name: actionName, parameters: parameters};
                    backand.options.ajax.json(url, data, backand.options.verbs.get, successCallback, errorCallback);
                }
			},
            /* get the object data */
			url: '/objects/',
			/* get a single row by the primary key (id) */
			getOne: function (name, id, deep, successCallback, errorCallback) {
				var url = backand.options.getUrl(backand.api.object.url + name + '/' + id);
				var data = { deep: deep };
				backand.options.ajax.json(url, data, backand.options.verbs.get, successCallback, errorCallback);
			},
			/* get a list of rows with optional filter, sort and page */
			getList: function (name, withSelectOptions, withFilterOptions, pageNumber, pageSize, filter, sort, search, deep, successCallback, errorCallback) {
				var url = backand.options.getUrl(backand.api.object.url + name);
				var data = { withSelectOptions: withSelectOptions, withFilterOptions: withFilterOptions, pageNumber: pageNumber, pageSize: pageSize, filter: JSON.stringify(filter), sort: JSON.stringify(sort), search: search, deep: deep };
				backand.options.ajax.json(url, data, backand.options.verbs.get, successCallback, errorCallback);

			},
			create: function (name, data, successCallback, errorCallback, params) {
				var url = backand.options.getUrl(backand.api.object.url + name);
				if (params)
					url += '?' + backand.options.objectToQueryString(params);
				backand.options.ajax.json(url, data, backand.options.verbs.post, successCallback, errorCallback);
			},
			update: function (name, id, data, successCallback, errorCallback, params) {
				var url = backand.options.getUrl(backand.api.object.url + name + '/' + id);
				if (params)
					url += '?' + backand.options.objectToQueryString(params);
				backand.options.ajax.json(url, data, backand.options.verbs.put, successCallback, errorCallback);
			},
			delete: function (name, id, successCallback, errorCallback) {
				var url = backand.options.getUrl(backand.api.object.url + name + '/' + id);
				backand.options.ajax.json(url, null, backand.options.verbs.delete, successCallback, errorCallback);
            }
        }
    },
    filter: {
        item: function (fieldName, operator, value) {
            this.fieldName = fieldName;
            this.operator = operator;
            this.value = value;
        },
        operator: {
            numeric: { equals: "equals", notEquals: "notEquals", greaterThan: "greaterThan", greaterThanOrEqualsTo: "greaterThanOrEqualsTo", lessThan: "lessThan", lessThanOrEqualsTo: "lessThanOrEqualsTo", empty: "empty", notEmpty: "notEmpty" },
            date: { equals: "equals", notEquals: "notEquals", greaterThan: "greaterThan", greaterThanOrEqualsTo: "greaterThanOrEqualsTo", lessThan: "lessThan", lessThanOrEqualsTo: "lessThanOrEqualsTo", empty: "empty", notEmpty: "notEmpty" },
            text: { equals: "equals", notEquals: "notEquals", startsWith: "startsWith", endsWith: "endsWith", contains: "contains", notContains: "notContains", empty: "empty", notEmpty: "notEmpty" },
            boolean: { equals: "equals" },
            relation: { in: "in" }
        }
    },
    field:{
        type: {
            ShortText: "ShortText",
            LongText: "LongText",
            Image: "Image",
            Url: "Url",
            Numeric: "Numeric",
            Boolean: "Boolean",
            DateTime: "DateTime",
            SingleSelect: "SingleSelect",
            MultiSelect: "MultiSelect"
        },
        displayFormat: {
            ShortText: { Email: "Email", Password: "Password", SSN: "SSN", Phone: "Phone" },
            LongText: { MultiLines: "MultiLines", MultiLinesEditor: "MultiLinesEditor", SingleLine: "SingleLine", Html: "Html" },
            Image: { Crop: "Crop", Fit: "Fit" },
            Url: { Hyperlink: "Hyperlink", ButtonLink: "ButtonLink" },
            Numeric: { GeneralNumeric: "GeneralNumeric", Currency: "Currency", NumberWithSeparator: "NumberWithSeparator", Percentage: "Percentage" },
            Boolean: {},
            DateTime: { Date_mm_dd: "Date_mm_dd", Date_dd_mm: "Date_dd_mm", Date_mm_dd_12: "Date_mm_dd_12", Date_dd_mm_12: "Date_dd_mm_12", Date_mm_dd_24: "Date_mm_dd_24", Date_dd_mm_24: "Date_dd_mm_24", Date_Custom: "Date_Custom" },
            SingleSelect: { DropDown: "DropDown", AutoCompleteStratWith: "AutoCompleteStratWith", AutoCompleteMatchAny: "AutoCompleteMatchAny" },
            MultiSelect: { Checklist: "Checklist", SubGrid: "SubGrid" }
        }
    },
    sort: {
        item: function (fieldName, order) {
            this.fieldName = fieldName;
            this.order = order;
        },
        order: { asc: "asc", desc: "desc" }

    }


};


backand.filter.item.prototype.constructor = backand.filter.item;

backand.filter.item.prototype.fieldName = function () {
    return this.fieldName;
};

backand.filter.item.prototype.operator = function () {
    return this.operator;
};

backand.filter.item.prototype.value = function () {
    return this.value;
};


backand.sort.item.prototype.constructor = backand.sort.item;

backand.sort.item.prototype.fieldName = function () {
    return this.fieldName;
};

backand.sort.item.prototype.order = function () {
    return this.order;
};




