const GPIO = require('onoff').Gpio;
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

const BOARD = "TinkerBoard";

const pins = new Map([
  ["TinkerBoard", [168,224]],
  ["RaspberryPi", [6,26]]
]);

const relay = new GPIO(pins.get(BOARD)[0], 'out');
const button = new GPIO(pins.get(BOARD)[1], 'in', 'falling', {debounceTimeout: 10});    //E stop button

let frontend = null; //frontend connection object (EventSource)

app.use(cors());
app.use(express.json());

/**Listen for activity on button GPIO pin */
button.watch((error, value) => {
    if(error){
        console.log(error);
    }
    //console.log('E stop pressed');
    writeToFile('Estop Press in Backend\n');
    relay.writeSync(0);
    sendSSE({message: 'E stop pressed'});
})

/**Send E-stop press notification to frontend */
const sendSSE = (data) => {
    if(frontend !== null){
        frontend.res.write(`data: ${JSON.stringify(data)}\n\n`);
        writeToFile('Sent Estop to Frontend Success\n')
    }
    else{
        writeToFile('Sent Estop to Frontend Fail\n')
    }
}

/**Make or close frontend connection */
const connectFrontend = (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    frontend = {req, res}; //initialize the global 'frontend' variable
    writeToFile('Frontend Connection Established\n')
    //console.log('Frontend Connection Established')

    req.on('close', () => {
        writeToFile('Frontend Connection Broke\n')
        //console.log('Frontend Connection Broke')
        frontend = null;
    });
}

/**Function to write to log-file.txt */
function writeToFile(data) {
    fs.open('log_file.txt', 'a', function(err, file) {
	if (err) {console.error(err);}
	fs.write(file, data, function(err) {
	    if (err) {console.error(err);}
	    fs.close(file, function(err){
		if (err) {console.error(err);}
	    });
	});
    });
}

/**Create Frontend connection if not currently exist */
app.get('/pin', (req, resp) => {
    if(frontend === null){
    	connectFrontend(req, resp);
    }
})

/**Recieve and set relay value */
app.post('/pin', (req, resp) => {
    //console.log(`relay becomes ${req.body.state}`)
    writeToFile(`relay becomes ${req.body.state}\n`)
    relay.writeSync(req.body.state);
    resp.send("true")
    //log success or fail of pin change
})

/**Recieve message from Frontend to write to Log-file */
app.post('/writeToFile',(req, resp) => {
    //console.log(req.body.data);
    writeToFile(req.body.data);
    resp.send("true")
    //resp.status(200)
});

/**Open port for frontend connection */
const server = app.listen(port, () => {
    //console.log(`Backend listening on port ${port}`);
    writeToFile(`Backend listening on port ${port}\n`);
    playTheSound();
})

/**Handle safe close */
process.on('SIGINT', _ => {
    console.log('got sigint, closing')
    writeToFile('Backend is closing\n')
    relay.unexport();
    button.unexport();
    server.close();
})
