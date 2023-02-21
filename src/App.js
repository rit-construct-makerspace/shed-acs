import React, {useState} from "react"
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

  /*
   When Machine in use, state of current user
  */
  const [currUser, setUser] = useState('')

  /*
  This function is called every time the uid-textbox is updated
  */
  const checkUid = (uidTemp) => {
    /*only perform update if no current user*/
    if (currUser == "") 
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
      else if (uidTemp[0] != ";" &&  uidTemp[0] != "0" && uidInput.length === UNFORMATTED_RFID_UID_LENGTH){
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
    setOutput("last uid swiped: " + validUid)
    setUser(validUid)
    setInUse("Machine in Use")
  }

  /*
  remove current user
  */
  function logoutUID() {
    //alert("Current user " + currUser + " logging out"); // check user is expected before removed
    setUser("")
    setInUse("")
  }

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
    <div>
      <button onClick={logoutUID}>Log Out</button>
    </div>
  </div>
  
  )
}
export default App