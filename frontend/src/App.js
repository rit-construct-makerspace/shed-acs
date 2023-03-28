import React, {useState, useEffect} from "react"
import axios from "axios";
import "./App.css"

const App = () => {

  //the server's url
  const url = "https://makerspace.herokuapp.com/graphql"

  //gpio local backend url
  const gpioBackend = "http://localhost:3001/pin"

  const graphQLQuery = `query HasAccess($id:ID!, $uid:String) {
    equipment(id: $id){
      hasAccess(uid: $uid)
    }
  }`;

  //constant length of a university ID num
  const UNFORMATTED_MAG_UID_LENGTH = 15
  const UNFORMATTED_RFID_UID_LENGTH = 9

  //constant for time
  const MINUTES = 60                  // 1 min = 60 sec
  const HOUR = 60*MINUTES             // 1 hr = 60 min
  const USER_TIME_FRAME = 10*MINUTES  // 10 minutes
  const MACHINE_TIME_FRAME = 1*HOUR   // 1 hour
  
  //The ID of the machine this ACS BOX is attached to
  const EQUIPMENT_ID = 1 //CNC machine in test db

  //graphQL stuff, not super sure how this works


  /*
  This state tracks whether the e stop button has been pressed
  */
  const [eStopPressed, setEStopPressed] = useState(false)

  /*
  This piece of state contains the text currently
  dispalyed in uid-textbox
  */
  const [uidInput, setUidInput] = useState('')

  /*
  This piece of state contains the text for the "User has access"
  element
  */
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

  /*
  This function is called every time the uid-textbox is updated
  */
  const checkUid = (uidTemp) => {
    setUidInput(uidTemp)//echo uid to textbox
    //check for valid input
    if(uidTemp[0] === ";" && uidInput.length === UNFORMATTED_MAG_UID_LENGTH)
    { 
      ProccessUID(uidTemp.slice(1, 10))
    }
    else if(uidTemp[0] === "0" && uidInput.length === UNFORMATTED_RFID_UID_LENGTH)
    { 
      ProccessUID(uidTemp.slice(1, 10))
    }
    else if (uidTemp[0] !== ";" &&  uidTemp[0] !== "0" && 
      uidInput.length === UNFORMATTED_RFID_UID_LENGTH){
      setUidInput('');
      setOutput("Current User: " + currUser)
    }
  }

  /* 
  This function process the university ID
    if no current user, set user
    else if current user rescans card, reset logout timer
    else process new user overide
  */
  function ProccessUID(validUid){
    if (currUser === ""){ 
      sendQuery(validUid)
    }
    else if (validUid === currUser){
      setUserTime(USER_TIME_FRAME)
      setUidInput('');
      setUserOverride("")
      setInUse("Machine in Use")
    }
    else {
      // New user wants to override machine
      if (userOverride === "" || userOverride !== validUid){
        setUserOverride(validUid)
        setInUse("Machine in Use => " + validUid + " scan again for override")
      }
      // New user scanned card twice
      else if (userOverride === validUid) {
        logoutUID()
        sendQuery(userOverride)
      }
      setUidInput('');
    }
  }

  /*
  This function is called when the uid state is updated
  It queries the server by sending the uid and machine id
  to the server, then sets the output state based on the response
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

    //tell gpioBackend to turn on the relay
    const pinObj = {
      state: 1
    }

    axios.post(gpioBackend, pinObj)

    //reset the uid textbox
    setUidInput('');
    setOutput("Current User: " + validUid)
    setUser(validUid)
    setInUse("Machine in Use")
    document.body.style.background = "Crimson";
    document.getElementById("UIDinput").style.background = "Crimson";
    document.getElementById("UIDinput").style.color = "Crimson";
  }

  /*
  remove current user
  */
  function logoutUID() {
    
    //tell gpioBackend to turn off the relay
    const pinObj = {
      state: 0
    }
    axios.post(gpioBackend, pinObj)
    
    setUser("")
    setUserOverride("")
    setOutput("")
    setInUse("")
    setUserTime(USER_TIME_FRAME)
    document.body.style.background = "LimeGreen";
    document.body.style.animation = "flash 0s";
    document.getElementById("UIDinput").style.background = "LimeGreen";
    document.getElementById("UIDinput").style.color = "LimeGreen";
    document.getElementById("UIDinput").style.animation = "flash 0s";
  }

  /*
  reset Maintenance Request Timer
  */
  function resetRequest(){
    setMachineTime(MACHINE_TIME_FRAME)
  }

  /*
  Timers count down while exists a current user
  */
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

  /*
  Auto Logout Current user when userTime == 0
  */
  useEffect(() => {
    if (userTime === 0) {
      logoutUID()
    }
    if (userTime === MINUTES){
      document.body.style.animation = "flash 2s infinite";
      document.getElementById("UIDinput").style.animation = "flash 2s infinite";
    }
    let min = Math.floor(userTime/60);
    let sec = userTime%60;
    setSecond(sec > 9 ? sec : '0' + sec);
    setMinute(min > 9 ? min : '0' + min);
  }, [userTime]);

  /*
  This effect is called once at the start of the application
  and sets up an EventSource to listen for e stop button press
  events
  */
  useEffect(() => {
    const eventSource = new EventSource(gpioBackend);
    eventSource.onmessage = (event) => {
      //log frontend e stop msg received
      console.log('received e stop msg')
      setEStopPressed(true);
    };
  }, [])

  return(
  <div className="acs-parent">
    <div className="uid-textbox">
      <input id="UIDinput" autoFocus="autofocus" value={uidInput} onChange={(event) => checkUid(event.target.value)} />
    </div>
    <div className="server-response">
      {output.length > 0 ? (<p>{output}</p>) : (<p>Swipe or tap ID</p>)}
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
