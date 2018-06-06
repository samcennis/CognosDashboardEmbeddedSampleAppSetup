//Load in previous dashboards from Cloudant.
var loadDashboards = function(clientId){
    var loadDashboardUrl = "/dashboards";

    //var clientId = document.getElementById("client-id-data-span").dataset.clientId;

    if (clientId){
        loadDashboardUrl = loadDashboardUrl + "?clientId=" + clientId;
    }

    fetch(loadDashboardUrl, {
        method : "GET"
    }).then(
        response => response.json() // .json(), etc.
        // same as function(response) {return response.text();}
    ).then(
        function(resp){
            console.log(resp);
            var ul = document.getElementById("saved-dashboards-list");

            //Clear current list (if any) before loading docs
            ul.innerHTML = "";

            if (resp.length === 0)
                ul.innerHTML = "<i>You haven't saved any dashboards yet.</i>";

            resp.forEach(function(dashboard){
                
                //List item representing a dashboard
                var li = document.createElement("div");

                //Keep the id and rev for later as data attributes
                li.dataset.id = dashboard._id;
                li.dataset.rev = dashboard._rev;
                
                li.classList.add("saved-dashboard-container");

                //First span onclick is loading the dashboard. Second is deleting.
                var spanLoadDashboard = document.createElement("span");
                var spanDeleteDashboard = document.createElement("span");

                spanLoadDashboard.appendChild(document.createTextNode(dashboard._id));
                spanLoadDashboard.onclick = openDashboard;
                spanLoadDashboard.classList.add("saved-dashboard-link");

                //console.log(dashboard);
                //Remove Cloudant metadata "_id" and "_rev" from dashboard spec
                var dashboardSpec = Object.assign({},dashboard); 
                delete dashboardSpec._id;
                delete dashboardSpec._rev;

                //console.log(dashboardSpec);
                spanLoadDashboard.dataset.dashboardSpec = JSON.stringify(dashboardSpec);

                //Delete dashboard span is represented by an " X"
                spanDeleteDashboard.appendChild(document.createTextNode(" X"));
                spanDeleteDashboard.onclick = deleteDashboard;
                spanDeleteDashboard.classList.add("delete-dashboard-button");

                li.appendChild(spanDeleteDashboard);
                li.appendChild(spanLoadDashboard);

                ul.appendChild(li);
            })
            return;
        } 
    );
};

//Create a Cognos Dashboard Embedded Session
var createSession = function(){

    const createSessionUrl = "/session";

    var clientId = document.getElementById('client-id-input').value;
    var clientSecret = document.getElementById('client-secret-input').value;
    var webDomain = window.location.href;

    fetch(createSessionUrl, {
        method : "POST",
        body: JSON.stringify({clientId: clientId, clientSecret: clientSecret, webDomain: webDomain})
    }).then(
        response => response.json() // .json(), etc.
        // same as function(response) {return response.text();}
    ).then(
        function(resp){
            console.log(resp);

            var sessionCodeSpan = document.getElementById("session-code-span");
            sessionCodeSpan.innerHTML = resp.sessionCode;
            sessionCodeSpan.dataset.sessionCode = resp.sessionCode;

            //Persist client ID for use later
            var clientIdDataSpan = document.getElementById("client-id-data-span");
            clientIdDataSpan.dataset.clientId = clientId;

            loadDashboards(clientId);

        }
    );
};

//Initialize the CDE API Framework
var initializeAPIFramework = function(){
    
    var sessionCodeSpan = document.getElementById("session-code-span");
    var sessionCode = sessionCodeSpan.dataset.sessionCode;

    if (!sessionCode){
        return console.error("No session code yet. You must create a session first.")
    }

    window.api = new CognosApi({
        cognosRootURL: 'https://dde-us-south.analytics.ibm.com/daas/',
        sessionCode: sessionCode,
        node: document.getElementById('dashboard-container')
    });
    window.api.initialize().then(function() {
        console.log('API created successfully.');
    }, function(err) {
        console.log('Failed to create API. ' + err.message);
    });
    
}

//Create a new dashboard
var createDashboard = function() {
    window.api.dashboard.createNew().then(
        function(dashboardAPI) {
            console.log('Dashboard created successfully.');
            window.dashboardAPI = dashboardAPI;

            //Create unique "default" name for this new dashboard
            document.getElementById("dashboard-name-input").value = "MyDashboard_" + generateUID();
            
            //Dashboard will be created in edit mode. Update radio button group to reflect
            document.getElementById("edit-mode-choice").checked = true;
        }
    ).catch(
        function(err) {
            console.log('User hit cancel on the template picker page.');
        }
    );
}

//Open an existing dashboard from the dashboard list
var openDashboard = function() {
    //Get _id, _rev, and _dashboardSpec associated with the dashboard that was clicked on to be loaded
    var _id = this.parentElement.dataset.id;
    var _rev = this.parentElement.dataset.rev;
    var dashboardSpec = JSON.parse(this.dataset.dashboardSpec);

    //Add _id and _rev as data attributes of the dashboard HTML element to use when saving back to Cloudant
    var dashboardContainer = document.getElementById("dashboard-container");
    dashboardContainer.dataset.id = _id;
    dashboardContainer.dataset.rev = _rev;

    window.api.dashboard.openDashboard({
        dashboardSpec: dashboardSpec
    }).then(
        function(dashboardAPI) {
            console.log('Dashboard created successfully.');
            window.dashboardAPI = dashboardAPI;

            //Populate the "Dashboard name" input with name of the opened dashboard
            document.getElementById("dashboard-name-input").value = dashboardContainer.dataset.id;

            //Dashboard will be opened in view mode. Update radio button group to reflect
            document.getElementById("view-mode-choice").checked = true;
        }
    ).catch(
        function(err) {
            console.log(err);
        }
    );
};

//Save dashboard to Cloudant
var saveDashboard = function() {

    var saveDashboardUrl = "/dashboards"

    var dashboardName = encodeURI(document.getElementById('dashboard-name-input').value);

    if (dashboardName.length === 0){
        console.error("No dashboard name provided.")
        return;
    } else {
        saveDashboardUrl += "/" + dashboardName;
    }

    console.log(saveDashboardUrl);

    //Get the dashboard spec
    window.dashboardAPI.getSpec().then(
        function(spec){
            console.log("SPEC FOR CURRENT DASHBOARD TO BE SAVED TO CLOUDANT: ");
            console.log(JSON.stringify(spec));

            //Add in clientID of current CDE service to mark to tie this dashboard to CDE service
            var clientId = document.getElementById("client-id-data-span").dataset.clientId;
            spec.clientId = clientId;

            //Check to see if this dashboard has previously been in Cloudant. If so, we want to add the _id and _rev to the spec
            var dashboardContainer = document.getElementById("dashboard-container");
            spec._id = dashboardContainer.dataset.id;
            spec._rev = dashboardContainer.dataset.rev;

            spec.name = dashboardName;

            fetch(saveDashboardUrl, {
                method : "PUT",
                body: JSON.stringify(spec)
            }).then(
                response => response.json() // .json(), etc.
                // same as function(response) {return response.text();}
            ).then(
                function(resp){
                    //console.log(resp);
                    console.log("Dashboard saved. Waiting 2 seconds, then refreshing dashboard list from Cloudant.");
                    setTimeout(function(){loadDashboards(clientId);},2000);
                }

            );


        }
    );
}

//Delete dashboard stored in Cloudant
var deleteDashboard = function(){


    var deleteDashboardUrl = "/dashboards"

    var _id = this.parentElement.dataset.id;
    var _rev = this.parentElement.dataset.rev;
    
    console.log("Deleting dashboard: " + _id);

    var result = confirm("Are you sure you want to delete " + _id + " from the database?");

    if (result) {

        deleteDashboardUrl += "/" + _id;

        fetch(deleteDashboardUrl, {
            method : "DELETE",
            body: JSON.stringify({"_id":_id,"_rev":_rev})
        }).then(
            response => response.json() // .json(), etc.
            // same as function(response) {return response.text();}
        ).then(
            function(resp){
                //console.log(resp);
                console.log("Dashboard deleted. Waiting 2 seconds, then refreshing dashboard list from Cloudant.");
                
                var clientId = document.getElementById("client-id-data-span").dataset.clientId;
                setTimeout(function(){loadDashboards(clientId);},2000);
            }

        );


        var saveDashboardUrl = "/dashboards"

        var dashboardName = encodeURI(document.getElementById('dashboard-name-input').value);

        if (dashboardName.length === 0){
            console.error("No dashboard name provided.")
            return;
        } else {
            saveDashboardUrl += "/" + dashboardName;
        }

        console.log(saveDashboardUrl);

    }

}

var generateCSVSpec = function() {

    //Call the correct CSV spec generation endpoint based on the load data mode selected

    var loadDataModes = document.getElementsByName('load-data-mode');
    var loadDataModeValue;

    for (var i=0;i<loadDataModes.length;i++){
        if (loadDataModes[i].checked){
            loadDataModeValue = loadDataModes[i].value;
            break;
        }
    }

    if (loadDataModeValue === "csv-url"){
        generateCSVSpecFromCSVUrl();
    } else if (loadDataModeValue === "cos") {
        generateCSVSpecFromCOS();
    }

};


//Generate a sample CSV data source specification based on a CSV source URL
var generateCSVSpecFromCSVUrl = function() {

    const loadCSVSpecUrl = "/csvspec";

    var csvUrl = document.getElementById('csv-url-input').value;
    var specName = document.getElementById('data-spec-name-input').value;

    fetch(loadCSVSpecUrl, {
        method : "POST",
        body: JSON.stringify({url: csvUrl, specName: specName})
    }).then(
        response => response.json() // .json(), etc.
        // same as function(response) {return response.text();}
    ).then(
        function(resp){
            console.log(resp);

            csvSpecCodeArea = document.getElementById("csv-spec-code-area");
            csvSpecCodeArea.value = JSON.stringify(resp,undefined,2);

            //Fit height of textarea to new text
            csvSpecCodeArea.style.height = "";
            csvSpecCodeArea.style.height = csvSpecCodeArea.scrollHeight + 3 + "px";

        }
    );

};

//Generate a sample CSV data source specification based on a CSV stored in IBM Cloud Object Storage
var generateCSVSpecFromCOS = function() {

    const loadCSVSpecUrl = "/csvspec-from-cos";

    var cosApiKey = document.getElementById('cos-api-key-input').value;
    var cosEndpoint = document.getElementById('cos-endpoint-input').value;
    var cosBucketName = document.getElementById('cos-bucket-name-input').value;
    var cosObjectKey = document.getElementById('cos-object-key-input').value;

    var specName = document.getElementById('data-spec-name-input').value;

    fetch(loadCSVSpecUrl, {
        method : "POST",
        body: JSON.stringify({
            cosApiKey: cosApiKey, 
            cosEndpoint: cosEndpoint,
            cosBucketName: cosBucketName,
            cosObjectKey: cosObjectKey,
            specName: specName
        })
    }).then(
        response => response.json() // .json(), etc.
        // same as function(response) {return response.text();}
    ).then(
        function(resp){
            console.log(resp);

            csvSpecCodeArea = document.getElementById("csv-spec-code-area");
            csvSpecCodeArea.value = JSON.stringify(resp,undefined,2);

            //Fit height of textarea to new text
            csvSpecCodeArea.style.height = "";
            csvSpecCodeArea.style.height = csvSpecCodeArea.scrollHeight + 3 + "px";

        }
    );

};

//Add a data source based on the CSV data source specification
var addDataSource = function() {

    var module = JSON.parse(document.getElementById("csv-spec-code-area").value);

    //Temporary fix: add in "cache refresh token" to ensure that CSV URL is treated as new and doesn't use existing cache
    module.source.srcUrl.sourceUrl += ("?cacheRefreshToken=" + generateUID())

    //Set the source name to the name used when generating the spec (this could be different if desired)
    var sourceName = document.getElementById('data-spec-name-input').value;

    window.dashboardAPI.addSources([{
        module: module,
        name: sourceName,
        id: generateUID()
    }])
};

//Undo last action
var undoAction = function() {
    window.dashboardAPI.undo();
};

//Redo previously undone action
var redoAction = function() {
    window.dashboardAPI.redo();
};

//Toggle right-side properties pane
var togglePropertiesPane = function() {
    window.dashboardAPI.toggleProperties();
};

//Set dashboard to VIEW, EDIT, or EDIT GROUP mode
var setDashboardMode = function() {

    var dashboardModes = document.getElementsByName('dashboard-mode');
    var dashboardModeValue;

    for (var i=0;i<dashboardModes.length;i++){
        if (dashboardModes[i].checked){
            dashboardModeValue = dashboardModes[i].value;
            break;
        }
    }

    if (dashboardModeValue === "edit"){
        dashboardAPI.setMode(dashboardAPI.MODES.EDIT);
    } else if (dashboardModeValue === "view") {
        dashboardAPI.setMode(dashboardAPI.MODES.VIEW);
    } else if (dashboardModeValue === "edit-group"){
        dashboardAPI.setMode(dashboardAPI.MODES.EDIT_GROUP);
    }
};

//Set data mode to CSV from URL or from IBM Cloud Object Storage
var setLoadDataMode = function() {

    var loadDataModes = document.getElementsByName('load-data-mode');
    var loadDataModeValue;

    for (var i=0;i<loadDataModes.length;i++){
        if (loadDataModes[i].checked){
            loadDataModeValue = loadDataModes[i].value;
            break;
        }
    }

    //Divs to show and hide based on the load data mode selected
    var urlDiv = document.getElementById("csv-from-url-inputs");
    var cosDiv = document.getElementById("csv-from-cos-inputs");

    if (loadDataModeValue === "csv-url"){
        urlDiv.style.display = "block";
        cosDiv.style.display = "none";

    } else if (loadDataModeValue === "cos") {
        urlDiv.style.display = "none";
        cosDiv.style.display = "block";
    }
};

//Toggle visibility of the left column so the dashboard has more screen real estate
var toggleLeftColumn = function() {
    var lCol = document.getElementById("left-col");
    var rCol = document.getElementById("right-col");
    var toggleButton = document.getElementById("toggle-left-column-button");
    
    if (lCol.style.display === "none") {
        lCol.style.display = "block";
        rCol.style.width = "75%";
        toggleButton.innerHTML = "<";

    } else {
        lCol.style.display = "none";
        rCol.style.width = "100%";
        toggleButton.innerHTML = ">";
    }

};

//Generate a globally unique ID
var generateUID= function() {
    return 'a' + Math.random().toString(36).substr(2, 9);
};


