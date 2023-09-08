import React, {useState, useEffect} from "react";
import axios from "axios";
import "./App.css";
import sound1 from "./sound/sound1.wav";
import sound2 from "./sound/sound2.wav";

const App = () => {

  //the server's url
  const url = "https://make.rit.edu/graphql"

  //gpio local backend url
  const gpioBackend = "http://localhost:3001/pin"
  const writeBackend = "http://localhost:3001/writeToFile"

  const graphQLQuery = `query HasAccess($id:ID!, $uid:String) {
    equipment(id: $id){
      hasAccess(uid: $uid)
    }
  }`;

  //constant length of a university ID num
  const UNFORMATTED_MAG_UID_LENGTH = 15   //i.e. ;XXXXXXXXXXXXXX
  const UNFORMATTED_RFID_UID_LENGTH = 9   //i.e. 0XXXXXXXXX

  //constant for time
  const MINUTES = 60                  // 1 min = 60 sec
  const HOUR = 60*MINUTES             // 1 hr = 60 min
  const USER_TIME_FRAME = 1*MINUTES/12 + 5   // Time user has for machine use
  const MACHINE_TIME_FRAME = 1*HOUR   // Time machine has before maintenance check
  
  //The ID of the machine this ACS BOX is attached to
  const EQUIPMENT_ID = 1 //CNC machine in test db
  
  //This state tracks whether the e stop button has been pressed
  const [eStopPressed, setEStopPressed] = useState(false)
  
  //This piece of state contains the text currently
  //  dispalyed in uid-textbox
  const [uidInput, setUidInput] = useState('')

  //This piece of state contains the text for the "User has access" element
  const [output, setOutput] = useState('')

  //machine state
  const [inUse, setInUse] = useState('')
  
  //state contains current user
  const [currUser, setUser] = useState('')

  //state contains current user
  const [userOverride, setUserOverride] = useState('')

  //Count time user is logged in
  const [userTime, setUserTime] = useState(USER_TIME_FRAME)
  const [timeSecond, setSecond] = useState("00")
  const [timeMinute, setMinute] = useState("00")
  //const [timeHour, setHour] = useState(USER_TIME_FRAME)
  
  //Machine Maintenance time
  const [machineTime, setMachineTime] = useState(MACHINE_TIME_FRAME)

  // Basic Audio to be played on login / logout
  const loginSound = new Audio(sound1)
  const logoutSound = new Audio(sound2)

  /**This function is called every time the uid-textbox is updated*/
  const checkUid = (uidTemp) => {
    if (!eStopPressed){
      setUidInput(uidTemp); //echo uid to textbox
    }
    //check for valid input
    if(uidTemp[0] === ";" && uidInput.length === UNFORMATTED_MAG_UID_LENGTH){
      var testing = uidTemp.slice(1, 10)
      ProccessUID(uidTemp.slice(1, 10));
      console.log(testing);

    }
    else if(uidTemp[0] === "0" && uidInput.length === UNFORMATTED_RFID_UID_LENGTH){ 
      ProccessUID(uidTemp.slice(1, 10));
    }
    else if (uidTemp[0] !== ";" &&  uidTemp[0] !== "0" && 
              uidInput.length === UNFORMATTED_RFID_UID_LENGTH){
      setUidInput('');
      setOutput("Invalid Swipe");
    }
  }

 /**This function process the university ID
  *   if no current user, set user
  *   else if current user rescans card, reset logout timer
  *   else process new user overide
  * Parameter: validUid - 9-digit University ID for user accessing machine
  */
  function ProccessUID(validUid){
    writeToBack("Card Swipped\n");
    //if no user is currently logged in, begin process to login
    if (currUser === ""){
      sendQuery(valcidUid);
    }
    else if (validUid === currUser){
      // Current User wants to add more time, reset user time
      writeToBack("\tADD TIME => " + validUid + "\n");
      setUidInput('');
      setUserOverride("");
      setInUse("Machine in Use");
      setUserTime(USER_TIME_FRAME);
      document.body.style.animation = "flash 0s";
      document.getElementById("UIDinput").style.animation = "flash 0s";
    }
    else {
      // New user wants to override machine
      if (userOverride === "" || userOverride !== validUid){
        setUserOverride(validUid);
        setInUse("Machine in Use => Swipe Again to Override User");
      }
      // New user scanned card twice
      else if (userOverride === validUid) {
        writeToBack("\tUSER OVERRIDE => " + validUid + "\n");
        logoutUID();
        sendQuery(userOverride);
      }
      setUidInput('');
    }
  }

 /**This function is called when the uid state is updated
  *   It queries the server by sending the uid and machine id
  *   to the server, then sets the output state based on the response
  * Parameter: validUid - 9-digit University ID for user accessing machine
  */
  const sendQuery = (validUid) => {
    
    const body =  { 
        query: graphQLQuery, 
        variables: {"id": EQUIPMENT_ID, "uid": validUid}
    }
    const options = {
        headers: {
            'Content-Type': 'application/json'
        }
    }

    axios.post(url, body, options)
      .then(resp => console.log(resp.data))
      .catch(error =>console.error(error))
    // set access variable to match the query response
    let access = true;
    //Example UID for no access
    if (validUid === "222222222" || validUid === "666666666"){
      access = false;
    }
    if (access === true) {
      loginUID(validUid);
    }
    else {
      setOutput("User Recognized");
      setInUse("Not Allowed Access to Machine");
      setUidInput('');
    }
  }
  
  /**Log in a current user */
  function loginUID(validUid) {
    writeToBack("\tUser Logged: " + validUid + "\n");
    
    const pinObj = {
      state: 1
    }
    //tell gpioBackend to turn on the relay
    axios.post(gpioBackend, pinObj)
      .then(response => {
        //if(response.ok) {console.log('Relay Change 1 Success')}
        console.log('Relay Change 1 Success ', Boolean(response.data))
      });

    loginSound.play();
    
    //reset the uid textbox
    setUidInput('');
    setOutput("User Logged In");
    setUser(validUid);
    setInUse("Machine in Use");
    document.body.style.background = "Crimson";
    document.body.style.animation = "flash 0s";
    document.getElementById("UIDinput").style.background = "Crimson";
    document.getElementById("UIDinput").style.color = "Crimson";
    document.getElementById("UIDinput").style.animation = "flash 0s";
  }

  /**Remove current user a.k.a Log out */
  function logoutUID() {
    writeToBack("\tUser Out: " + currUser + "\n");
    
    //tell gpioBackend to turn off the relay
    const pinObj = {
      state: 0
    }
    axios.post(gpioBackend, pinObj)
      .then(response => {
	      console.log('Relay Change 0 Success ', Boolean(response.data))
      });
    
    logoutSound.play();

    setUser("");
    setUserOverride("");
    setOutput("");
    setInUse("");
    setUserTime(USER_TIME_FRAME);
    document.body.style.background = "LimeGreen";
    document.body.style.animation = "flash 0s";
    document.getElementById("UIDinput").style.background = "LimeGreen";
    document.getElementById("UIDinput").style.color = "LimeGreen";
    document.getElementById("UIDinput").style.animation = "flash 0s";
  }

  /**Function allows Frontend to write to the log in the Backend */
  function writeToBack(msg){
    axios.post(writeBackend, {data: msg})
      .then(response => {
	      console.log('Write Success ', Boolean(response.data))
      });
  }

  /**Reset Maintenance Request Timer */
  function resetRequest(){
    setMachineTime(MACHINE_TIME_FRAME);
  }

  /**Timers count down while there exists a current user */
  useEffect(() => {
    // create a interval and get the id
    const secInterval = setInterval(() => {
      if (currUser !== "") {
        setUserTime((userTime !== 0) ? ((prevTime) => prevTime - 1) : 0);
        setMachineTime((machineTime !== 0) ? ((prevTime) => prevTime - 1) : 0);
      }
    }, 1000);
    // clear out the interval using it id when unmounting the component
    return () => clearInterval(secInterval);
  }, [currUser, machineTime, userTime]);

 /**Auto Logout Current user when userTime == 0
  *   Keep Count of User Time
  */
  useEffect(() => {
    if (userTime === 0) {
      logoutUID();
    }
    if (userTime === MINUTES){
      document.body.style.animation = "flash 2s infinite";
      document.getElementById("UIDinput").style.animation = "flash 2s infinite";
    }
    //update user time in html
    let min = Math.floor(userTime/60);
    let sec = userTime%60;
    setSecond(sec > 9 ? sec : '0' + sec);
    setMinute(min > 9 ? min : '0' + min);
  }, [userTime]);

 /**This effect is called once at the start of the application
  *   and sets up an EventSource to listen for E-Stop button 
  *   press events
  */
  useEffect(() => {
    const eventSource = new EventSource(gpioBackend);
    eventSource.onmessage = (event) => {
      writeToBack("Frontent Recieve Estop Press \n");
      setEStopPressed(true);
      logoutUID();
      setTimeout(()=> setEStopPressed(false), 2000);    // ############################## FOR TESTING PURPOSE
    };
  }, [])

  //HTML Output
  return(
  <div className="acs-parent">
    <div className="uid-textbox">
      <input id="UIDinput" autoFocus="autofocus" value={uidInput} onChange={(event) => checkUid(event.target.value)} />
    </div>
    <div className="server-response">
      {output.length > 0 ? (<p>{output}</p>) : (<p>Swipe or Tap ID</p>)}
    </div>
    <div className="machine-use"> {inUse.length > 0 ? (<p>{inUse}</p>) : (<p>Machine Ready</p>)} </div>
    <div className="user-time"> {userTime > 0 ? (<p>{timeMinute}:{timeSecond}</p>) : (<p>Timed Out</p>)} </div>
    <div> {machineTime > 0 ? (<div className="machine-time"><p>{machineTime}</p></div>) : (
      <div>
        <button onClick={resetRequest}>Reset Maintenance</button>
      </div>
      )} 
    </div>
  </div>
  )
}
export default App
