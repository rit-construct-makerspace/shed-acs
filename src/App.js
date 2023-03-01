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

  const [inUse, setInUse] = useState('')
  
  //state contains current user
  const [currUser, setUser] = useState('')

  //Count time user is logged in
  const [timeCount, setTimeCount] = useState(USER_TIME_FRAME)
  
  //Machine Maintenance time
  const [machineTime, setMachineTime] = useState(MACHINE_TIME_FRAME)

  /*
  This function is called every time the uid-textbox is updated
  */
  const checkUid = (uidTemp) => {
    /*only perform update if no current user*/
    if (currUser === "") 
    {
      setUidInput(uidTemp)
      if(uidTemp[0] === ";" && uidInput.length === UNFORMATTED_MAG_UID_LENGTH)
      { 
        const validUid = uidTemp.slice(1, 10)
        sendQuery(validUid);
      }
      else if(uidTemp[0] === "0" && uidInput.length === UNFORMATTED_RFID_UID_LENGTH)
      { 
        const validUid = uidTemp.slice(1, 10)
        sendQuery(validUid);
      }
      else if (uidTemp[0] !== ";" &&  uidTemp[0] !== "0" && 
        uidInput.length === UNFORMATTED_RFID_UID_LENGTH){
        setUidInput('');
        setOutput("last uid swiped: Invalid")
        setInUse("")
      }
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
    setOutput("")
    setInUse("")
    setTimeCount(USER_TIME_FRAME)
  }

  function resetRequest(){
    setMachineTime(MACHINE_TIME_FRAME)
  }

  useEffect(() => {
    // create a interval and get the id
    const secInterval = setInterval(() => {
      if (currUser !== "") {
        setTimeCount((timeCount != 0) ? ((prevTime) => prevTime - 1) : 0);
        setMachineTime((machineTime != 0) ? ((prevTime) => prevTime - 1) : 0);
      }
    }, 1000);
    // clear out the interval using it id when unmounting the component
    return () => clearInterval(secInterval);
  }, [currUser]);

  useEffect(() => {
    if (timeCount === 0) {
      logoutUID()
    }
  }, [timeCount]);

  return(
  <div className="acs-parent">
    <div className="uid-textbox">
      <input value={uidInput} onChange={(event) => checkUid(event.target.value)} />
    </div>
    <div className="server-response">
      {output.length > 0 ? (<p>{output}</p>) : (<p>Swipe or tap ID</p>)}
    </div>  
    <div className="uid-logout">
      {inUse.length > 0 ? (<p>{inUse}</p>) : (<p>No One Here</p>)}
    </div>
    <div> {timeCount > 0 ? (<p>{timeCount}</p>) : (<p>Timed Out</p>)} </div>
    <div> {machineTime > 0 ? (<p>{machineTime}</p>) : (<p>Maintenance Request</p>)} </div>
    <div>
      {(machineTime == 0) && <button onClick={resetRequest}>Reset Maintenance</button>}
    </div>
  </div>
  )
}
export default App