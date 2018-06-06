# Cognos Dashboard Embedded Sample App Setup

This repository contains instructions to set up and deploy a sample application incorporating Cognos Dashboard Embedded dashboards. This app demonstrates the basic API calls needed to initialize and use Cognos Dashboard Embedded within an app, using client-side JavaScript and a Node-RED (visual Node.js) backend. It uses Cloudant to demonstrate persisting dashboards as JSON docs between Cognos Dashboard Embedded sessions. It also includes a utility to help generate sample data source specifications for CSV files. Use this sample app to understand the basic flow needed to quickly augment your web application with interactive, engaging data visualization using Cognos Dashboard Embedded on IBM Cloud.

Follow these instructions to familiarize yourself with the application and get it up and running yourself. 

## First, try this app out by creating an IBM Cognos Dashboard Embedded service in your IBM Cloud account.

If you do not already have one, sign up for a free IBM Cloud account here: https://console.bluemix.net/registration/

Create an instance of IBM Cognos Dashboard Embedded in your IBM Cloud account here: https://console.bluemix.net/catalog/services/ibm-cognos-dashboard-embedded

Select the "Lite" plan and then "Create". After creating the service, select "Service Credentials" from the left menu, then "New Credential" to generate a new set of credentials. Name the credentials whatever you wish. Select "View credentials", and copy the "client_id" and "client_secret" values.

Now that your have our Cognos Dashboard Embedded service credentials, you can try out this app here (before setting it up with the instructions below): https://cognos-dashboard-embedded-sample-app.mybluemix.net/

Keep in mind that dashboards you save at this link are stored with full visibility in my own Cloudant database... so avoid creating dashboards or using data that containes sensitive/private information.

See the [Using this application section](#using-this-application) if you need assistance while walking through the app.

## Now set the app up yourself in your own IBM Cloud account. 

### Deploy the Node-RED Starter Application.

From the IBM Cloud catalog, deploy the Node-RED starter application to your IBM Cloud account. This will set up and deploy a Node-RED application the leverages Cloudant (NoSQL database) to persist Node-RED "flows". With a couple of tweaks, this starter application will become the sample application that leverages Cognos Dashboard Embedded. Node-RED is an open source, visual programming tool originally created by IBM to quickly create Node.js applications with little to no programming involved. In this application, Node-RED is used to define a simple RESTful API backend to interact with both Cognos Dashboard Embedded and Cloudant. 

https://console.bluemix.net/catalog/starters/node-red-starter

After entering a unique "App name" (refered from this point forward as _your-app-name_) and select "Create" to provision the Node-RED starter in your own IBM Cloud account. This will create an "SDK for Node.js" Cloud Foundry application and a connected Cloudant database in your IBM Cloud account.

From the “Getting Started” page of the Node-RED starter application, (you should be taken here automatically) follow the instructions under “Customizing your Node-RED instance” in order to install the Cloud Foundry command line interface, then download and extract the starter code locally.

*IMPORTANT* : Before deploying the app to IBM Cloud, run the following command in the your-app-name directory. We are using an additional dependency that is not by default installed with the Node-RED starter.

`npm install -save node-red-contrib-cloudantplus`

This will update the dependencies file (packages.json) appopriately. 

Now follow the rest of the instructions to connect and authenticate with Bluemix, then deploy _your-app-name_ back to IBM Cloud with “cf push”.

After your app is up and running (It will take a few minutes. You should see a confirmation of “running” state on the command line), visit _your-app-name_.mybluemix.net/ to get started with the Node red editor.

Follow the steps in the menu "Welcome to your new Node-RED instance on IBM Cloud"
1. I recommend securing your editor with a username and passcode, (remember this…it’s important), select Next
2. You do not need any additional nodes right now, so select Next
3. Select “Finish”
4. On the new screen that appears, select “Go to your Node-RED flow editor” then log in with Username and Password you just defined.

You are now at the Node-RED flow designer and we can copy in the backend that defines the REST API backend for this application. 

### Import the Node-RED flow from flows.json

If you aren't already there, visit _your-app-name_.mybluemix.net/red and log in to your editor. You should be at the flow editing page. You can take a look at all the connectors to the left… pretty cool! We can be productive building Node.js apps very quickly using these nodes.

Select the sandwich menu in the top right to get a drop down menu. Select Import > Clipboard.

Copy the text contained within the [flows.json](/flows.json) file and paste it into the “Paste nodes here” section. Selet "current flow". Then click Import. Click to drop the imported nodes on the canvas. 

This is the complete RESTful API backend for the application.

#### Verify correct connection to your Cloudant database in the two Cloudant nodes

In the GET /dashboards flow, double-click on the "dashboards" node to edit the Cloudant connection details. Under Service, insure that _your-app-name_-cloudantNoSQLDB is selected. This was the Cloudant instance that was created with the Node-RED Starter application to store the Node-RED flows. It is also where we will persist dashboards in between Cognos Dashboard Embedded sessions, in the "dashboards" database. Ensure the same Cloudant instance is specified in the "dashboards" node in the PUT /dashboards/:name flow.

Now select "Deploy". Your REST API backend is now completely set up and running. Awesome!

### Configure the Cloudant NoSQL database service to persist and load dashboards

The REST API defined in the Node-RED flow will load and save dashboards to a database within our Cloudant service called "dashboards". This database has not been created yet. We need to create this database and add a JSON "Design Document" that defines how we would like to query this database.

#### Create "dashboards" database.

From the IBM Cloud dashboard (https://console.bluemix.net/), select your Cloudant database. It should be listed under "Cloud Foundry Services" and have the name _your-app-name_-cloudantNoSQLDB. Then select "Launch Cloudant Dashboard". You should now see Your Databases. Currently there is just one, "nodered". This is what Node-RED is using to store flows that you create. We'd like to create another called "dashboards" that will save dashboards we create with Cognos Dashboard Embedded service as JSON documents. 

In the upper-right corner of the string, select "Create Database". Specify `dashboards` as the name of the database.

#### Add a Design Document to the database to define our query.

Within the "dashboards" database view, select the "+" button by Design Document and click "New Doc". Copy and paste the contents of the [dashboardsDesignDoc.json](/dashboardsDesignDoc.json) file into the text editor. Completely replace the JSON object that is pre-populated in the text editor.

This Design Document defines a Cloudant mechanism called a "view" that allows our app to filter its query based on the "clientId" property of dashboards that are saved. This is how we can filter dashboards at the database level to return only appropriate dashboards to a particular user. This app will only display dashboards to a user based on the clientId of their Cognos Dashboard Embedded service.

### Add the client-side code for the app.

We can add client-side code to our Node-RED application as well to display at the root of the domain (https://_your-app_name_.mybluemix.net/). We can place content (HTML, CSS, JS) within the "public" folder that we'd like to display when users visit.

This GitHub repository contains the client-side code for this application in the [/public](/public) folder. We can simply replace the existing /public directory of the Node-RED Starter application with this and our app will be set up.

First, download this repository as a ZIP folder and extract it to access the [/public](/public) directory.

Then, replace the current /public directory (within the /your-app-name directory) on your local machine with the [/public](/public) directory you just downloaded from this repository.

After replacing the /public directory, run `cf push your-app-name` one more time to re-deploy the app to IBM Cloud. 

Your app is all set up! Go to https://_your-app-name_.mybluemix.net to view your personal version of this application. 

## Using this application

1. Plug in the Client ID and Client Secret you gathered from your Cognos Dashboard Embedded service.

2. Select the "Create Session" button to send a request to the POST /sessions endpoint that we set up in our Node-RED backend. Take a look at this section of our Node-RED flow to view the request details sent to the Cognos Dashboard Embedded session creation endpoint. A session code is returned. This is also where an enryption key would be returned if we wanted to connect to a JDBC database and we could use this to encrypt database credentials server-side before returning them to the client.

3. Select "Initialize API Framework". You'll see that an iframe is created within our #dashboard-container DIV. This is where we will interact with the Cognos Dashboard Embedded within our webpage.

4. Select "Create" to create a new dashboard. You'll be prompted to select a layout. Select the basic 2x2 layout option. (The 9th layout listed). Select "OK" to enter the dashboard building view.

5. Next we will add a data source. 

By default, the app will use a link to a sample CSV file hosted on my GitHub account (dataSetSample.csv[/dataSetDemo.csv]), but you can replace it with your own CSV if you like. This sample CSV file represents sales data for a retailer that sells outdoor equipment. You'll see an option to use a CSV stored in IBM Cloud Object Storage as well, for this example we will not use that.

Select "Generate Data Source Spec From CSV URL" to leverage a utility contained within this sample application to assist with building data source specifications (JSON format) for Cognos Dashboard Embedded.

The utility built into this sample app will take a look at the first row of the CSV. Based on column names and data values, a best guess of the column's data type, usage, default aggregation, and taxonomy will be inferred. Make sure to take a look at what is generated and just use this utility as a starting point. Details on creating data source specifications for Cognos Dashboard Embedded can be found here:
https://console.bluemix.net/docs/services/cognos-dashboard-embedded/working_with_datasources.html#working-with-data-sources

Wait for up to 15 seconds and the text area underneath "Data Source Spec:" will populate with the generated data source spec. Especially when using your own CSV files, you'll want to make sure that column attributes are defined correctly, since this sample application's tool will not infer correctly every time. It is a helpful starting point so we do not need to start from scratch each time.

Now select "Add a Data Source Based on this Spec to Dashboard" to add it to the dashboard. The data source spec will be stored along with the dashboard.

6. Build your dashboard. You'll see that "New Data Source" has been added as a source within your dashboard building view. Click on this source and expand the table to see column names available to leverage in your visualization creation. For example, select "Quantity" and drag it into a quarter of the 2x2 layout dashboard. You'll see the total revenue across the full dataset. Now drag "Product line" into the same quarter of the dashboard. Cognos will use its "smarts" to create a column chart based on the column types of Product line and Revenue and update the visualization appopriately.

Drag "Quantity" into another corner of the dashboard to see the total quantity sold across all data. Now click on the column in the column chart representing Camping Equipment. You'll see that the quantity decreases, because the dashboard filters according to this selection.

7. Select "Save Current Dashboard" to save your dashboard. This is done by getting the dashboard specification of the currently opened dashboard as a JSON document and sending it to Cloudant. Data sources you've added are saved within this JSON document as well. Your Cognos Dashboard Embedded Client ID will be added to the document, so the next time you start a session with that Client ID, previously dashboards you've saved will be loaded.
