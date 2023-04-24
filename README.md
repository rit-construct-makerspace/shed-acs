# shed-acs
This is the repository for the application that runs on the SHED Access Control System boxes. It consists of two separate applications, frontend and backend. 
The frontend is hosted as part of the software team's server on their heroku instance, and acts as the UI. The backend runs locally on the Raspberry Pi or Tinkerboard and handles switching 
the relay and detecting E-Stop presses via the GPIO.

**Prerequisites:** [Node.js](https://nodejs.org/en/download)

## Running the backend manually (Only works on Pi or Tinkerboard due to expecting GPIO)
1. Open a terminal or command prompt and navigate to this directory
2. Navigate to the backend directory `cd backend`
3. Run the command `npm install`
4. Run the command `node index.js`

The backend application will now be running inside this terminal and logging to it.


## Running the frontend manually and locally (Pi, Tinkerboard, or Desktop)

1. Open a terminal or command prompt and navigate to this directory
2. Navigate to the frontend directory `cd frontend`
3. Run the command `npm install`
4. Run the command `npm run build`
5. Navigate to the build directory `cd build` and open index.html with a web browser (ex. chrome)
