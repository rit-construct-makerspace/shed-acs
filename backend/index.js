const GPIO = require('onoff').Gpio;
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;
const relay = new GPIO(6, 'out');
const button = new GPIO(26, 'in', 'falling', {debounceTimeout: 10}); //E stop button

let frontend = null; //frontend connection object (EventSource)

app.use(cors());
app.use(express.json());

button.watch((error, value) => {
    if(error){
        console.log(error);
    }
    console.log('E stop pressed');
    writeToFile('Estop Press in Backend\n');
    relay.writeSync(0);
    //setTimeout(() => relay.writeSync(0), 2000);
    sendSSE({message: 'E stop pressed'});
})


const sendSSE = (data) =>
{
    if(frontend !== null){
    
        frontend.res.write(`data: ${JSON.stringify(data)}\n\n`);
        writeToFile('Sent Estop to Frontend Success\n')
	//write to logger ('successful send to frontend')
    }
    else{
        writeToFile('Sent Estop to Frontend Fail\n')
        //write to logger ('failed to send to frontend')
    }
    
}

const connectFrontend = (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    frontend = {req, res}; //initialize the global 'frontend' variable
    writeToFile('Frontend Connection Established\n')
    //console.log('Frontend Connection Established')
    //log server->frontend connection established

    req.on('close', () => {
        writeToFile('Frontend Connection Broke\n')
        //console.log('Frontend Connection Broke')
        //log server->frontend connection broke
        frontend = null;
    });
}

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

app.get('/pin', (req, resp) => {
    if(frontend === null){
    	connectFrontend(req, resp);
    }
})

app.post('/pin', (req, resp) => {
    console.log(`relay becomes ${req.body.state}`)
    writeToFile(`relay becomes ${req.body.state}\n`)
    relay.writeSync(req.body.state);
    resp.send("true")
    //resp.status(200)
    //log success / fail of pin change
})

app.post('/writeToFile',(req, resp) => {
    console.log(req.body.data);
    writeToFile(req.body.data);
    resp.send("true")
    //resp.status(200)
});

const server = app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
    writeToFile(`Backend listening on port ${port}\n`);
})


/*
Handle safe close
*/
process.on('SIGINT', _ => {
    console.log('got sigint, closing')
    writeToFile('Backend is closing\n')
    relay.unexport();
    button.unexport();
    server.close();
})
