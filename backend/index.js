const GPIO = require('onoff').Gpio;
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;
const relay = new GPIO(6, 'out');

app.use(cors());
app.use(express.json());

app.post('/pin', (req, resp) => {
    
    console.log(`relay becomes ${req.body.state}`)
    relay.writeSync(req.body.state);
})

const server = app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
})

setTimeout(_ => {
    relay.unexport();
    server.close();
    process.exit();
}, 100000);