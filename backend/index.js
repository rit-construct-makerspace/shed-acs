const GPIO = require('onoff').Gpio;
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;
const relay = new GPIO(6, 'out');
const button = new GPIO(26, 'in', 'rising', {debounceTimeout: 10}); //E stop button

let frontend = null; //frontend connection object (EventSource)

app.use(cors());
app.use(express.json());

button.watch((error, value) => {
    if(error){
        console.log(error);
    }
    console.log('e stop pressed');	
    sendSSE({message: 'E stop pressed'});
})


const sendSSE = (data) =>
{
    if(frontend !== null){
    
        frontend.res.write(`data: ${JSON.stringify(data)}\n\n`);
        //write to logger ('successful send to frontend')
    }
    else{
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
    //log server->frontend connection established

    req.on('close', () => {
        //log server->frontend connection broke
        frontend = null;
    });
}

app.get('/pin', (req, resp) => {
    if(frontend === null){
    	connectFrontend(req, resp);
    }
})

app.post('/pin', (req, resp) => {
    console.log(`relay becomes ${req.body.state}`)
    relay.writeSync(req.body.state);
    //log success / fail of pin change
})

const server = app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
})


/*
Handle safe close
*/
process.on('SIGINT', _ => {
    relay.unexport();
    button.unexport();
    server.close();
})
