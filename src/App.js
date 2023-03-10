import React, {useState, useEffect} from "react"
import axios from "axios";

const App = () => {

  //the server's url
  const url = "https://localhost:3000/graphql"

  const graphQLQuery = `
    query ($equipmentID: ID!, $uid: ID!) {
      equipment(id: $equipmentID) {
        hasAccess(uid: $uid)
      }
    }
  `;

  //constant length of a university ID num
  const UNFORMATTED_MAG_UID_LENGTH = 15
  const UNFORMATTED_RFID_UID_LENGTH = 9

  //constant for time
  const USER_TIME_FRAME = 10
  const MACHINE_TIME_FRAME = 20
  
  //The ID of the machine this ACS BOX is attached to
  const EQUIPMENT_ID = 1 //CNC machine in test db

  //graphQL stuff, not super sure how this works


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
    
    const vars = {
      EQUIPMENT_ID: 1,
      uid: validUid
    }

    axios.post(url, {
      graphQLQuery,
      vars
    })
    .then(resp => console.log(resp.data))
    .catch(error =>console.error(error))

    //reset the uid textbox
    setUidInput('');
    setOutput("Current User: " + validUid)
    setUser(validUid)
    setInUse("Machine in Use")
  }

  /*
  remove current user
  */
  function logoutUID() {
    setUser("")
    setUserOverride("")
    setOutput("")
    setInUse("")
    setUserTime(USER_TIME_FRAME)
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
  }, [userTime]);

  const activeMachineStyle = {
    color: "white",
    backgroundColor: "Crimson",
    padding: "100px",
  }

  const inactiveMachineStyle = {
    color: "white",
    backgroundColor: "LimeGreen",
    padding: "100px",
  }

  function setVisual(){
    if (currUser === ""){
      return inactiveMachineStyle
    }
    else if (userTime < 5){
      return userTime%2 === 0 ? inactiveMachineStyle : activeMachineStyle
    }
    else {
      return activeMachineStyle
    }
    //return currUser === "" ? inactiveMachineStyle : activeMachineStyle
  }

  return(
  <div className="acs-parent" style={setVisual()}>
    <div className="uid-textbox">
      <input value={uidInput} onChange={(event) => checkUid(event.target.value)} />
    </div>
    <div className="server-response">
      {output.length > 0 ? (<p>{output}</p>) : (<p>Swipe or tap ID</p>)}
    </div>  
    <div> {inUse.length > 0 ? (<p>{inUse}</p>) : (<p>No One Here</p>)} </div>
    <div> {userTime > 0 ? (<p>{userTime}</p>) : (<p>Timed Out</p>)} </div>
    <div> {machineTime > 0 ? (<p>{machineTime}</p>) : (
      <div>
        <p>Maintenance Request</p>
        <button onClick={resetRequest}>Reset Maintenance</button>
      </div>
      )} 
    </div>
  </div>
  )
}
export default App