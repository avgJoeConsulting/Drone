
var device = require('azure-iot-device');
var bebop = require("node-bebop");

var drone = bebop.createClient();
var clientFromConnectionString = require('azure-iot-device-http').clientFromConnectionString;

var location = process.env.DEVICE_LOCATION || 'Drone at Home';

var connectionString = process.env.IOTHUB_CONN || 'HostName=joedronedemo.azure-devices.net;DeviceId=parrotdrone;SharedAccessKey=4C3tHFsBqzpCH888sqw5bkUVatvaRI5xaPzaxYqshCA=';

var droneclient = clientFromConnectionString(connectionString);
var deviceId = device.ConnectionString.parse(connectionString).DeviceId;
var altitude;
var navData;
var positionChanged;
var speedChanged;
var attitudeChanged;
var Sound = require('node-aplay');
var Telnet = require('telnet-client');
var connection = new Telnet();
var cmd;
var params = {
  host: '192.168.42.1',
  shellPrompt: '/ # ',
  timeout: 1500,
  // removeEcho: 4
};
 
// fire and forget: 
//new Sound('/home/pi/Development/Drone/song/dangerzone.wav').play();
 
// with ability to pause/resume: 
var music = new Sound('/home/pi/Development/Drone/song/dangerzone.wav');
// with ability to pause/resume: 
var musicFootloose = new Sound('/home/pi/Development/Drone/song/Footloose.wav');
 
connection.on('ready', function(prompt) {
  connection.exec(cmd, function(err, response) {
    console.log(response)
  })
})
connection.on('timeout', function() {
  console.log('socket timeout!')
  connection.end()
})

connection.on('close', function() {
  console.log('connection closed')
})

drone.connect();
drone.on("AltitudeChanged",function(data){
    altitude = data;
});
drone.on("navdata",function(data){
    navData = data;
});
drone.on("PositionChanged",function(data){
    positionChanged = data;
});
drone.on("AttitudeChanged",function(data){
    attitudeChanged = data;
});
drone.on("SpeedChanged",function(data){
    speedChanged = data;
});

drone.on("battery",function(data){
		var payload = JSON.stringify({
 		 batterypercentage: data,
		 altitudedata: altitude, 
		 navData: navData,
		 positionChanged: positionChanged,
		 attitudeChanged: attitudeChanged,
		 speedChanged: speedChanged});
        
	// Create the message based on the payload JSON
	var message = new device.Message(payload);
      
	// For debugging purposes, write out the message payload to the 
	console.log("Sending message: " + message.getData());

	// Send the message to Azure IoT Hub
	droneclient.sendEvent(message, printResultFor('send'));
   	console.log("Drone Battery Percentage: " + data);
 	}); 
	// Helper function to print results in the console
	function printResultFor(op) {
 	  return function printResult(err, res) {
 	  if (err) console.log(op + ' error: ' + err.toString());
 	  };
	}
 
//var SSH = require('simple-ssh');
 
//var ssh = new SSH({
//    host: '169.254.103.172',
//    user: 'pi',
//    pass: 'raspberry'
//});

var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

// Create connection to database
var config = {
    //userName: 'sa', // update me
    //password: 'Jwb@79762756', // update me
    //server: 'DESKTOP-57G65N2',
    //options: {
    //    database: 'ConnectedCar'
    //}
    userName: 'adminlogin',
    password: 'P@ssw0rd',
    server: 'starwarsneu.database.windows.net',
    // If you are on Microsoft Azure, you need this:  
    options: { encrypt: true, database: 'starwars' } 

}
var connection = new Connection(config);

var dronecommandid;

//client.on('navdata', console.log);
// Attempt to connect and execute queries if connection goes through
connection.on('connect', function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected');
    	//ssh.exec('node /home/pi/Development/Drone/node_modules/node-bebop/examples/takeoff-events.js').start();
       }         
    
});
//logNavData();

setInterval(function () {
    queryDatabase();
}, 10000);
 

//ssh.exec('node /home/pi/Development/Drone/takeoff.js').start();

//setTimeout(function() {
//	ssh.exec('node /home/pi/Development/Drone/land.js').start();
//}, 2000);

function queryDatabase() {
    console.log('Reading rows from the Table...');
    var dronecommand;
    // Read all rows from table
    const request = new Request(
        //"select top 1 DroneCommandID,DroneCommand from DroneCommand with(nolock) where completed is null order by Created ",
        "with updateDroneCommand as (select row_number() over( order by DroneCommandID) as topcommand,DroneCommandID,DroneCommand from DroneCommand with(nolock) where completed is null) update d SET d.completed = getdate() Output Inserted.DroneCommand from DroneCommand d join updateDroneCommand u on d.DroneCommandID = u.DroneCommandID where u.topcommand = 1",
        function (err, rowCount, rows) {
            console.log(rowCount + ' row(s) returned');
        }
    );


    request.on('row', function (columns) {
        columns.forEach(function (column) {
            console.log("%s\t%s", column.metadata.colName, column.value);
            if (column.metadata.colName == "DroneCommandID") {
                dronecommandid = column.value;
            } else
            {
                dronecommand = column.value;
            }
            switch (dronecommand) {
                case "take off":
                    // do something
                    //ssh.exec('node /home/pi/Development/Drone/takeoff.js').start();
                     drone.Piloting.takeOff();
		    console.log("Drone Taking Off");
                    break;
                case "land":
                    // do something else
                    //client.stop(0);
                    //client.land();
		    //ssh.exec('node /home/pi/Development/Drone/land.js').start();
                    drone.Piloting.landing();
     		    console.log("Drone Landing");
                    break;
		case "up":
                    // do something else
                    //client.stop(0);
                    //client.land();
		    //ssh.exec('node /home/pi/Development/Drone/land.js').start();
                    music.play();

		    drone.up(1);
		    drone.stop(0);     		    
			console.log("Drone Landing");
                    break;
		case "down":
                    // do something else
                    //client.stop(0);
                    //client.land();
		    //ssh.exec('node /home/pi/Development/Drone/land.js').start();
                    drone.down(1);
     		    drone.stop(0);
		    music.pause();
                    console.log("Drone Landing");
                    break;
		case "hover":
                    // do something else
                    //client.stop(0);
                    //client.land();
		    //ssh.exec('node /home/pi/Development/Drone/land.js').start();
                    drone.Piloting.stop();
     		    console.log("Drone hover");
                    break;
                // and so forth
		case "play footloose":
                    musicFootloose.play();
                    break;
		case "pause footloose":
                    musicFootloose.pause();
                    break;
		case "resume footloose":
                    musicFootloose.resume();
                    break;
                // and so forth
		case "map a":
		    cmd ='cp /data/ftp/internal_000/flightplans/homea.mavlink /data/ftp/internal_000/flightplans/flightPlan.mavlink';
                    connection.connect(params);
                    break;	
                case "map b":
		    cmd ='cp /data/ftp/internal_000/flightplans/homec.mavlink /data/ftp/internal_000/flightplans/flightPlan.mavlink';
                    connection.connect(params);
                    break;	
                default:
                    // do something if nothing
                    //ssh.exec('node /home/pi/Development/Drone/land.js').start();
		    drone.Piloting.landing();
		    console.log("Drone Landing");
                    break;
            }

        });
    });

    connection.execSql(request);
};
