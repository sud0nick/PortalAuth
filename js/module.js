registerController('PortalAuthController', ['$api', '$scope', '$sce', '$interval', function($api, $scope, $sce, $interval) {

	// Settings elements
	$scope.portalStatus				= "Loading...";
	$scope.tServerConfig			= true;
	$scope.testSite					= "";
	$scope.dataExpected				= "";
	$scope.htmlTags					= "";
	$scope.portalArchive			= "";
	$scope.macCollection			= false;
	
	// Status elements
	$scope.online					= true;
	$scope.portalExists				= false;
	$scope.stop;
	
	// Log elements
	$scope.currentLogData			= "";
	$scope.errorlogs				= "";
	$scope.changelogs				= "";
	
	// Auto auth elements
	$scope.collectedMACs			= "No MACs have been collected yet.";
	$scope.autoAuthStatus			= "Not Running";
	
	// Throbbers
	$scope.showSettingsThrobber 	= false;
	$scope.showClonerThrobber		= false;
	$scope.showAutoAuthThrobber		= false;
	
	// Divs
	$scope.showPASSDiv				= true;
	$scope.showNetClientDiv			= false;
	$scope.showInjectManagerDiv		= true;
	$scope.showInjectEditorDiv		= false;
	
	// Cloner options defaults
	$scope.cloner_portalName		= "";
	$scope.cloner_injectionSet		= "";
	$scope.cloner_stripLinks		= false;
	$scope.cloner_stripJS			= false;
	$scope.cloner_stripCSS			= false;
	$scope.cloner_stripForms		= false;
	$scope.cloner_injectJS			= true;
	$scope.cloner_injectCSS			= true;
	$scope.cloner_injectHTML		= true;
	
	// PASS elements
	$scope.passStatus				= "Disabled";
	$scope.passEnabled				= false;
	$scope.passButton				= "";
	$scope.editorCode				= "";
    $scope.activityLogData          = "";
    $scope.availableTargets         = "";
	$scope.capturedCreds			= "Nothing here yet.";
	
	// Injection Editor Elements
	$scope.injectionSets				= {};
	$scope.pa_injectJSEditor			= "";
	$scope.pa_injectCSSEditor			= "";
	$scope.pa_injectHTMLEditor			= "";
	$scope.pa_injectPHPEditor			= "";
	$scope.pa_injectMyPortalPHPEditor	= "";
	$scope.newInjectSetName				= "";
	
	$scope.autoAuth = (function(){
		$scope.showAutoAuthThrobber = true;
		$scope.autoAuthStatus = "Attempting authentication...";
		$api.request({
			module: 'PortalAuth',
			action: 'autoAuth'
		},function(response) {
			if (response.success === false) {
				// Using this to check if MAC collection is allowed
				// so I don't need to make an extra request
				if (response.message === true) {
					$scope.autoAuthStatus = "Scanning network to collect MACs...";
					$api.request({
						module: 'PortalAuth',
						action: 'scanMACs'
					},function(response){
						if (response.success === true) {
							$scope.collectedMACs = response.data;
						}
					});
				}
			}
			$scope.autoAuthStatus = "Not Running";
			$scope.showAutoAuthThrobber = false;
		});
	});
	$scope.getConfigs = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'getConfigs'
		},function(response){
			data = response.data;
			$scope.testSite = data.testSite;
			$scope.dataExpected = data.dataExpected;
			$scope.htmlTags = data.tags;
			$scope.portalArchive = data.p_archive;
			if (data.mac_collection == "checked") {
				$scope.macCollection = true;
			} else {
				$scope.macCollection = false;
			}
		});
	});
	$scope.updateSettings = (function(type){
		$scope.showSettingsThrobber = true;
		configs = {};
		if (type === undefined) {
			configs['testSite'] = $scope.testSite;
			configs['dataExpected'] = $scope.dataExpected;
			configs['tags'] = $scope.htmlTags;
			configs['p_archive'] = $scope.portalArchive;
			configs['mac_collection'] = ($scope.macCollection) ? "checked" : "";
		} else {
			configs['testSite'] = "http://www.puffycode.com/cptest.html";
			configs['dataExpected'] = "No Captive Portal";
			configs['tags'] = "button;input;select;a;option";
			configs['p_archive'] = "/root/portals/";
			configs['mac_collection'] = "checked";
		}
		$api.request({
			module: 'PortalAuth',
			action: 'updateConfigs',
			params: configs
		},function(response){
			if (response.success === false) {
				// Log error
				console.log("Failed to update settings.");
			}
			$scope.getConfigs();
			$scope.checkTestServerConfig();
			$scope.checkPortalExists();
			$scope.showSettingsThrobber = false;
		});
	});
	$scope.checkTestServerConfig = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'checkTestServerConfig'
		},function(response){
			$scope.tServerConfig = response.success;
		});
	});
	$scope.getLogs = (function(logType){
		$api.request({
			module: 'PortalAuth',
			action: 'getLogs',
			type: logType
		},function(response){
			if (response.success === true) {
				if (logType == "error") {
					$scope.errorlogs = response.data;
				} else if (logType == "change") {
					$scope.changelogs = response.data;
				}
			}
		});
	});
	$scope.readLog = (function(log,type){
		$api.request({
			module: 'PortalAuth',
			action: 'readLog',
			file: log,
			type: type
		},function(response){
			if (response.success === true) {
				if (log == "pass.log") {
					$scope.activityLogData = response.data;
				} else if (log == "targets.log") {
					$scope.availableTargets = response.data;
				} else {
					$scope.currentLogTitle = log;
					$scope.currentLogData = $sce.trustAsHtml(response.data);
				}
			}
		});
	});
	$scope.download = (function(file){
		$api.request({
			module: 'PortalAuth',
			action: 'download',
			file: file
		},function(response){
			if (response.success === true) {
				window.location = '/api/?download=' + response.data;
			} else {
				console.log("PortalAuth - Failed to initiate download");
			}
		});
	});
	$scope.clearLog = (function(log){
		$api.request({
			module: 'PortalAuth',
			action: 'clearLog',
			file: log
		},function(response){
			if (response.success === true) {
				if (log == "activity") {
					$scope.activityLogData = "";
				} else if (log == "targets") {
					$scope.availableTargets = "";
				}
			}
		});
	});
	$scope.getCode = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'getCode'
		},function(response){
			if (response.success === true) {
				$scope.editorCode = response.data;
			} else {
				$scope.editorCode = "Failed to load file";
			}
		});
	});
	$scope.getInjectCode = (function(set){
		if (set == $scope.injectionSets[0]) {
			$scope.pa_injectJSEditor = "";
			$scope.pa_injectCSSEditor = "";
			$scope.pa_injectHTMLEditor = "";
			$scope.pa_injectPHPEditor = "";
			$scope.pa_injectMyPortalPHPEditor = "";
			return;
		}
		$api.request({
			module: 'PortalAuth',
			action: 'getInjectCode',
			injectSet: set
		},function(response){
			if (response.success === true){
				$code = response.data;
				$scope.pa_injectJSEditor = $code['injectjs'];
				$scope.pa_injectCSSEditor = $code['injectcss'];
				$scope.pa_injectHTMLEditor = $code['injecthtml'];
				$scope.pa_injectPHPEditor = $code['injectphp'];
				$scope.pa_injectMyPortalPHPEditor = $code['MyPortal'];
			}
		});
	});
	$scope.restoreEditorCode = (function(file){
		set = "";
		if (file.includes("inject") || file.includes("MyPortal")) {
			set = $scope.editor_injectionSet;
		}
		$api.request({
			module: 'PortalAuth',
			action: 'restoreCode',
			file: file,
			set: set
		},function(response){
			if (response.success === true){
				if (set == "") {
					$scope.editorCode = response.data;
					return;
				}
				if (file.includes("JS")) {
					$scope.pa_injectJSEditor = response.data;
				} else if (file.includes("CSS")) {
					$scope.pa_injectCSSEditor = response.data;
				} else if (file.includes("MyPortal")) {
					$scope.pa_injectMyPortalPHPEditor = response.data;
				} else if (file.includes("HTML")) {
					$scope.pa_injectHTMLEditor = response.data;
				} else if (file.includes("PHP")) {
					$scope.pa_injectPHPEditor = response.data;
				}
			} else {
				alert("Failed to restore file!");
			}
		});
	});
	$scope.saveEditorCode = (function(file){
		set = "";
		data = $scope.editorCode;
		if (file.includes("inject") || file.includes("MyPortal")) {
			set = $scope.editor_injectionSet;
			if (file.includes("JS")) {
				data = $scope.pa_injectJSEditor;
			} else if (file.includes("CSS")) {
				data =$scope.pa_injectCSSEditor;
			} else if (file.includes("MyPortal")) {
				data = $scope.pa_injectMyPortalPHPEditor;
			} else if (file.includes("HTML")) {
				data = $scope.pa_injectHTMLEditor;
			} else if (file.includes("PHP")) {
				data = $scope.pa_injectPHPEditor;
			}
		}
		$api.request({
			module: 'PortalAuth',
			action: 'saveCode',
			file: file,
			set: set,
			data: data
		},function(response){
			if (response.success === true){
				alert("File Saved Successfully!");
			} else {
				alert("Failed to restore file!");
			}
		});
	});
	$scope.backupEditorCode = (function(file){
		set = "";
		data = $scope.editorCode;
		if (file.includes("inject") || file.includes("MyPortal")) {
			set = $scope.editor_injectionSet;
			if (file.includes("JS")) {
				data = $scope.pa_injectJSEditor;
			} else if (file.includes("CSS")) {
				data =$scope.pa_injectCSSEditor;
			} else if (file.includes("MyPortal")) {
				data = $scope.pa_injectMyPortalPHPEditor;
			} else if (file.includes("HTML")) {
				data = $scope.pa_injectHTMLEditor;
			} else if (file.includes("PHP")) {
				data = $scope.pa_injectPHPEditor;
			}
		}
		$api.request({
			module: 'PortalAuth',
			action: 'backupCode',
			file: file,
			set: set,
			data: data
		},function(response){
			if (response.success === true){
				alert("File Backed Up Successfully!");
			} else {
				alert("Failed to back up file!");
			}
		});
	});
	$scope.deleteLog = (function(log){
		$api.request({
			module: 'PortalAuth',
			action: 'deleteLog',
			file: log
		},function(response){
			$scope.getLogs('error');
			if (response === false) {
				alert(response.message);
			}
		});
	});
	$scope.checkCopyJQuery = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'checkCopyJQuery'
		},function(response){
			if (response.success === false) {
				alert("An error has occurred.  Check the logs for details.");
			}
		});
	});
	$scope.isOnline = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'isOnline'
		},function(response){
			$scope.online = response.success;
		});
	});
	$scope.checkPortalExists = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'checkPortalExists'
		},function(response){
			$scope.portalExists = response.success;
			if ($scope.portalExists === true) {
				$scope.portalStatus = "Captive Portal Detected";
			} else {
				$scope.portalStatus = "No Captive Portal Detected";
			}
		});
	});
	$scope.newInjectionSet = (function(){
		if ($scope.newInjectSetName == "") {
			console.log("error");
			return;
		}
		
		$api.request({
			module: 'PortalAuth',
			action: 'createInjectionSet',
			name: $scope.newInjectSetName
		},function(response){
			if (response.success === true) {
				$scope.newInjectSetName = "";
				$scope.getInjectionSets();
			} else {
				alert("An error occurred.  Check the logs for details.");
			}
		});
	});
	$scope.getInjectionSets = (function(){
		$scope.injectionSets = {};
		$api.request({
			module: 'PortalAuth',
			action: 'getInjectionSets'
		},function(response){
			if (response.success === true) {
				$scope.injectionSets = response.data;
				$scope.cloner_injectionSet = $scope.injectionSets[0];
				$scope.editor_injectionSet = $scope.injectionSets[0];
			}
		});
	});
	$scope.downloadInjectSet = (function(set) {
		$api.request({
			module: 'PortalAuth',
			action: 'downloadInjectSet',
			set: set
		},function(response){
			if (response.success === true) {
				window.location = '/api/?download=' + response.data;
			}
		});
	});
	$scope.deleteInjectSet = (function(set) {
		var res = confirm("Press OK to confirm deletion of " + set + ".");
		if (!res) {return;}
		$api.request({
			module: 'PortalAuth',
			action: 'deleteInjectSet',
			set: set
		},function(response){
			if (response.success === true){
				$scope.getInjectionSets();
			} else {
				alert("Failed to delete injection set!");
			}
		});
	});
	$scope.clonePortal = (function(){
		
		// Make sure there is a portal name
		if (!$scope.cloner_portalName) {
			alert("You must enter a name for this portal.");
			return;
		}
		
		if ($scope.cloner_injectionSet == $scope.injectionSets[0]) {
			alert("Please select an injection set.  If you wish to clone the site as is then select the Blank injection set.");
			return;
		}
		
		// Check to make sure the portal doesn't already exist, if it does then prompt the user
		// to make a decision on whether to overwrite it or not
		$api.request({
			module: 'PortalAuth',
			action: 'clonedPortalExists',
			name: $scope.cloner_portalName
		},function(response){
			
			if (response.success === true) {
				var res = confirm("'" + $scope.cloner_portalName + "' already exists.  Are you sure you want to overwrite this portal?");
				if (res == false) {
					return;
				}
			}
			
			$scope.showClonerThrobber = true;
			
			// Build the argument list for the cloned portal
			clonerOpts = "";
			clonerOpts += $scope.cloner_stripLinks ? "striplinks;" : "";
			clonerOpts += $scope.cloner_stripCSS ? "stripcss;" : "";
			clonerOpts += $scope.cloner_stripJS ? "stripjs;" : "";
			clonerOpts += $scope.cloner_stripForms ? "stripforms;" : "";
			clonerOpts += $scope.cloner_injectJS ? "injectjs;" : "";
			clonerOpts += $scope.cloner_injectCSS ? "injectcss;" : "";
			clonerOpts += $scope.cloner_injectHTML ? "injecthtml;" : "";
			clonerOpts = clonerOpts.slice(0,-1);
			
			$api.request({
				module: 'PortalAuth',
				action: 'clonePortal',
				name: $scope.cloner_portalName,
				options: clonerOpts,
				inject: $scope.cloner_injectionSet
			},function(response){
				if (response.success === true) {
					if (response.message != null) {
						alert(response.message);
					} else {
						alert("Portal Cloned Successfully!");
					}
				} else {
					alert("An error has occurred.  Check the logs for details.");
				}
				$scope.showClonerThrobber = false;
			});
		});
	});
	$scope.prepareOptsModal = (function(){
		$scope.getInjectionSets();
		$scope.cloner_portalName 		= "";
		$scope.cloner_portalName		= "";
		$scope.cloner_injectionSet		= "";
		$scope.cloner_stripLinks		= false;
		$scope.cloner_stripJS			= false;
		$scope.cloner_stripCSS			= false;
		$scope.cloner_stripForms		= false;
		$scope.cloner_injectJS			= true;
		$scope.cloner_injectCSS			= true;
		$scope.cloner_injectHTML		= true;
	});
	$scope.swapDiv = (function(div){
		if (div == "pass") {
			$scope.showPASSDiv = true;
			$scope.showNetClientDiv = false;
			$scope.checkPASSRunning();
		} else if (div == "netclient") {
			$scope.showPASSDiv = false;
			$scope.showNetClientDiv = true;
		} else if (div == "injectManager") {
			$scope.showInjectManagerDiv = true;
			$scope.showInjectEditorDiv = false;
		} else if (div == "injectEditor") {
			$scope.getInjectionSets();
			$scope.showInjectManagerDiv = false;
			$scope.showInjectEditorDiv = true;
		}
	});
	$scope.checkPASSRunning = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'checkPASSRunning'
		},function(response) {
			if (response.success === true) {
				$scope.passStatus = "Running";
				$scope.passButton = "Stop";
				$scope.passEnabled = true;
			} else {
				$scope.passStatus = "Disabled";
				$scope.passButton = "Start";
				$scope.passEnabled = false;
			}
		});
	});
	$scope.toggleServer = (function(status){
		if (status == "Running") {
			$api.request({
				module: 'PortalAuth',
				action: 'stopServer'
			},function(response){
				$scope.checkPASSRunning();
			});
		} else if (status == "Disabled") {
			$api.request({
				module: 'PortalAuth',
				action: 'startServer'
			},function(response){
				$scope.checkPASSRunning();
			});
		}
	});
	$scope.getCapturedCreds = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'getCapturedCreds'
		},function(response){
			if (response.success === false || response.data == "") {
				$scope.capturedCreds = "Nothing here yet.";
			} else if (response.success === true) {
				$scope.capturedCreds = response.data;
			}
		});
	});
	$scope.clearCapturedCreds = (function(){
		$api.request({
			module: 'PortalAuth',
			action: 'clearCapturedCreds'
		},function(response){
			if (response.success === false) {
				alert("Failed to clear log.");
			}
			$scope.getCapturedCreds();
		});
	});
	
	// Not sure if this is ever reached
	$scope.$on('$destroy', function(){
		$interval.cancel($scope.stop);
		$scope.stop = undefined;
	});

	// Init functions
	$scope.isOnline();
	$scope.checkTestServerConfig();
	$scope.checkPortalExists();
	$scope.checkCopyJQuery();
	$scope.getConfigs();
	$scope.getLogs("change");
	$scope.stop = $interval(function(){
		$scope.readLog("pass.log", "pass");
		$scope.readLog("targets.log", "pass");
		$scope.getLogs("error");
		$scope.getCapturedCreds();
	}, 1000);
	$scope.getInjectionSets();
	$scope.checkPASSRunning();
}])
