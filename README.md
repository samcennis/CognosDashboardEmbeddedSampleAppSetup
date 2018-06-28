# IBM Cognos Dashboard Embedded - Sample App Setup

This repository contains instructions to set up and deploy a sample application incorporating Cognos Dashboard Embedded dashboards. This app demonstrates the basic API calls needed to initialize and use Cognos Dashboard Embedded within an app, using client-side JavaScript and a Node-RED (visual Node.js) backend. It uses Cloudant to persist dashboards as JSON docs between Cognos Dashboard Embedded sessions. It also includes a utility to help generate sample Data Source Specifications for CSV files. Use this sample app to understand the basic flow needed to quickly augment your web application with interactive, engaging data visualization using Cognos Dashboard Embedded on IBM Cloud.

Follow these instructions to familiarize yourself with the application and get it up and running yourself. 

## First, try the app out by creating an IBM Cognos Dashboard Embedded service in your IBM Cloud account

If you do not already have one, sign up for a free IBM Cloud account here: https://console.bluemix.net/registration/

Create an instance of IBM Cognos Dashboard Embedded in your IBM Cloud account here: https://console.bluemix.net/catalog/services/ibm-cognos-dashboard-embedded

Select the "Lite" plan and then "Create". After creating the service, select "Service Credentials" from the left menu, then "New Credential" to generate a new set of credentials. Name the credentials whatever you wish, and specify the role of "Manager". Select "View credentials", and copy the "client_id" and "client_secret" values. 

Now that your have our Cognos Dashboard Embedded service credentials, you can [try out this app first](https://cognos-dashboard-embedded-sample-app.mybluemix.net/) before [setting it up yourself with the instructions below](#now-set-the-app-up-yourself-in-your-ibm-cloud-account).

**Try this app out with the live version here:** https://cognos-dashboard-embedded-sample-app.mybluemix.net/

Keep in mind that dashboards you save at this link are stored with full visibility in my own Cloudant database... so avoid creating dashboards or using data that containes sensitive/private information.

See the [Using this application section](#using-this-application) if you need assistance while walking through the app.

## Now set the app up yourself in your IBM Cloud account 

### Deploy the Node-RED Starter Application

From the IBM Cloud catalog, deploy the Node-RED starter application to your IBM Cloud account. This will set up and deploy a Node-RED application the leverages Cloudant (NoSQL database) to persist Node-RED "flows". With a couple of tweaks, this starter application will become the sample application that leverages Cognos Dashboard Embedded. Node-RED is an open source, visual programming tool originally created by IBM to quickly create Node.js applications with little to no programming involved. In this application, Node-RED is used to define a simple RESTful API backend to interact with both Cognos Dashboard Embedded and Cloudant. 

https://console.bluemix.net/catalog/starters/node-red-starter

After entering a unique "App name" (refered from this point forward as _your-app-name_) and select "Create" to provision the Node-RED starter in your own IBM Cloud account. This will create an "SDK for Node.js" Cloud Foundry application and a connected Cloudant database in your IBM Cloud account.

### Download the Node-RED Starter Application code

From the “Getting Started” page of the Node-RED starter application, (you should be taken here automatically) follow the instructions under “Customizing your Node-RED instance” in order to install the Cloud Foundry command line interface, then download and extract the starter code from the ZIP folder on your local machine.

Now open up a command line interface/terminal, navigate to this extracted /_your-app-name_ folder, and ensure it is your working directory.

*IMPORTANT* : Before deploying the app to IBM Cloud, run the following command with /_your-app-name_ as the working directory. We are using an additional dependency that is not by default installed with the Node-RED starter.

`npm install -save node-red-contrib-cloudantplus`

This will update the dependencies file (packages.json) in /_your-app-name_ with the appropriate dependency of cloudantplus.

Now follow the rest of the "Customizing your Node-RED instance" instructions to connect and authenticate with Bluemix, then deploy _your-app-name_ back to IBM Cloud by running the command `cf push`. (Ensure that /_your-app-name_ is still your working directory)

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

#### Verify correct connection to your Cloudant database in the three Cloudant nodes

In the GET /dashboards flow, double-click on the "dashboards" node to edit the Cloudant connection details. Under Service, insure that _your-app-name_-cloudantNoSQLDB is selected. This was the Cloudant instance that was created with the Node-RED Starter application to store the Node-RED flows. It is also where we will persist dashboards in between Cognos Dashboard Embedded sessions, in the "dashboards" database. Ensure the same Cloudant instance is specified in the "dashboards" node in both the PUT /dashboards/:name and DELETE /dashboard/:name flows as well.

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

1. __Plug in the Client ID and Client Secret you gathered from your Cognos Dashboard Embedded (CDE) service.__

2. __Select the "Create Session" button__ to have CDE create a session and return a unique session code identifying this particular CDE session. The button triggers a request to the POST /sessions endpoint that we set up in our Node-RED app server. If you are interested in the specifics of what is occuring, take a look at that section of our Node-RED flow to view the request details sent to CDE or the (session creation documentation here[https://dde-us-south.analytics.ibm.com/api-docs/#]). This is also where an enryption key would be returned if we wanted to connect to a JDBC database, and we could use this to encrypt database credentials server-side before returning them to the client.

3. __Select "Initialize API Framework"__ This uses the session code with a JavaScript framework call to add an Iframe to our page, allowing our page to interact with CDE directly. The Iframe is where our dashboarding occurs, and takes up the majority of the screen of this sample app. You'll see that an iframe is created within the #dashboard-container DIV. This is where we will interact with the CDE within our webpage.

4. __Select "Create"__ to create a new dashboard. You'll be prompted to select a layout. Select the basic 2x2 layout option that divides the canvas intro quadrants. __Select "OK"__ to enter the dashboard building view.

5. Next we will add some data for CDE to connect to so we can visualize it within our dashboard. We do this by adding a data source. 

   By default, the app will use a link to a sample CSV file hosted on my GitHub account (dataSetSample.csv[/dataSetDemo.csv]) representing sales data for an outdoor equipment retailer, but you can replace it with a link to your own CSV if you would like to use other data. Note you must host the CSV in an external location, since the sample app will not store data locally. Also note that the app is a non-secure sample for the purposes of illustration; please do not use any sensitive, private, or personal data, especially with the live version. 
   
   You'll also see an option to use a CSV stored in IBM Cloud Object Storage as well, for this example we will not use that.
   
   CDE can also make a connection to data stored in several RDMBSes (Db2, PostgreSQL, SQL Server, and Oracle); however I did not put that functionality into my sample app. If this is something you're interested in, check out the documentation on (making secure connections to databases[https://console.bluemix.net/docs/services/cognos-dashboard-embedded/working_with_datasources.html#jdbc-data-sources]).

   __Select "Generate Data Source Spec From CSV URL"__ to leverage a utility contained within this sample application to assist with building data source specifications in JSON format for CDE.
   
    Data Source Specification contains information to tell CDE where your data is and how to interact with it appropriately, and we need to create one for each data source we add. (More details here[https://console.bluemix.net/docs/services/cognos-dashboard-embedded/working_with_datasources.html#csv-data-sources]) if you're interested.

   The utility built into this sample app will take a look at the first row of the CSV. Based on column names and data values, a best guess of the column's data type, usage, default aggregation, and taxonomy will be inferred. Make sure to take a look at what is generated and just use this utility as a starting point. Details on creating data source specifications for Cognos Dashboard Embedded (can be found here [https://console.bluemix.net/docs/services/cognos-dashboard-embedded/working_with_datasources.html#working-with-data-sources]).

   __Wait for up to 15 seconds__ and the text area underneath "Data Source Spec:" will populate with the generated data source spec. If you are using a link to a different CSV file than the default one, verify that the (table section describes the columns in the way you desire[https://console.bluemix.net/docs/services/cognos-dashboard-embedded/working_with_datasources.html#table-section-of-the-data-source-specification]), and customize as needed. This utility is simply a helpful starting point so we do not need to start from scratch each time. If you're using the Data Source Specification generated from the default CSV file, you won't need to make any changes to it.

   Now select __"Add a Data Source Based on this Spec to Dashboard"__ to add it to the dashboard. The data source specification will be passed to the dashboard by the JavaScript library and become part of the Dashboard Specification of the current dashboard. You'll see it pop up in the "Selected sources" pane.

6. __Build your dashboard.__ Now we can start building our dashboard (Step 6) with this data source. If you like, click the small button marked "<" at the top of the screen to hide the left column of the sample app. This gives us some more real estate to build out our dashboard. Click on the New Data Source and expand the table (also called New Data Source) to see all of the column names from this dataset that are available for you as you create the visualizations of your dashboard.

   Select "Quantity" and drag into the top-left quadrant of the 2x2 layout dashboard. You'll see the total quantity of all products sold.

   Now drag "Product line" into the same quadrant on top of this quantity. CDE will use its "smarts" to update the visualization based on the data we dragged in -- in this case a column chart.

   Now drag "Revenue" into the top-right quadrant of the dashboard to see the total revenue of all products old, then click on the column in the column chart representing Camping Equipment. You'll see that revenue value decreases, because the entire dashboard filters according to your selection. You are now seeing the revenue just for Camping Equipment sold.
   
   We will pause building this dashboard here. Feel free to continue to add to and customize this dashboard as you wish. To learn more about the Cognos Analytics dashboard creation experience, please see (IBM Cognos Analytics - Dashboard documentation[https://www.ibm.com/support/knowledgecenter/en/SSEP7J_11.0.0/com.ibm.swg.ba.cognos.ug_ca_dshb.doc/wa_dashboard_discoveryset_intro.html]).
   
7. Next we will save the dashboard. Cognos Dashboard Embedded is a stateless API and does not remember previous information about dashboards in between sessions, so our app itself is responsible for storing these dashboards for future use with CDE. This sample app is set up to get information about the currently opened dashboard and save it as a JSON document into a Cloudant NoSQL database on IBM Cloud. Cloudant is a good fit because it stores JSON documents as-is. If you are using the live version, note again to ensure your dashboard does not contain sensitive or personal information before saving. 

  If you had hidden the left column before, select ">" at the top of the page to show it once more. Provide a name for your dashboard and __select "Save Current Dashboard"__ to save your dashboard. This is done by getting the dashboard specification of the currently opened dashboard as a JSON document and sending it to Cloudant. Data sources you've added are saved within this JSON document as well. This app will add your Cognos Dashboard Embedded Client ID to the document, so the next time you start a session with that Client ID, previously dashboards you've saved will be loaded. You can select dashboards you've previously created from the "4b. Open an existing Dashboard" section to open them. The dashboard should load into the CDE frame of the sample app in View mode. Scroll to the bottom of the left column and select the "Edit" radio button if you would like to change the dashboard mode back to edit mode.
  
  Note that saved dashboards will be deleted from the live instance of the sample app on a recurring basis. So if you want to ensure your dashboards are kept safe, you'll need to set up your own instance of the sample app in your IBM Cloud account. 

If you stepped through the [Using this application section](#using-this-application) using the [live (previously deployed) version of this app](https://cognos-dashboard-embedded-sample-app.mybluemix.net/), and you have not set it up for yourself yet, try [setting it up in your IBM Cloud account](#now-set-the-app-up-yourself-in-your-ibm-cloud-account). 

If you have completed setting it up yourself, now you can think of some ways that you can provide value to a new or existing application by embedding engaging, interactive data visualizations. Good luck & happy building!

_This sample application was built by Sam Ennis, Sales Engineer for IBM Embedded Analytics Solutions_
