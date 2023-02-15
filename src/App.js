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

  //constant length of a university ID hash
  const UID_LENGTH = 9
  
  //The ID of the machine this ACS BOX is attached to
  const EQUIPMENT_ID = 1 //CNC machine in test db

  //graphQL stuff, not super sure how this works


  /*
  This piece of state contains the text currently
  dispalyed in uid-textbox
  */
  const [uid, setUid] = useState('')

  /*
  This piece of state contains the text for the "User has access"
  element
  */
  const [output, setOutput] = useState('')

  /*
  This function is called every time the uid-textbox is updated
  */
  const checkUid = (uidTemp) => {
    setUid(uidTemp)
    if(uid.length === UID_LENGTH)
    {
      sendQuery();
    }
  }

  /*
  This function is called when the uid state is updated
  It queries the server by sending the uid and machine id
  to the server, then sets the output state based on the response
  */
  const sendQuery = () => {
    
    const vars = {
      equipmentID: 1,
      uid: uid
    }

    axios.post(url, {
      graphQLQuery,
      vars
    })
    .then(resp => console.log(resp.data))
    .catch(error =>console.error(error))

    //reset the uid textbox
    setUid('');
  }


  return(
  <div className="acs-parent">
    <div className="uid-textbox">
      <input value={uid} onChange={(event) => checkUid(event.target.value)} />
    </div>
    <div className="server-response">
      {output.length > 0 ? (<p>{output}</p>) : (<p>Swipe or tap ID</p>)}
    </div>  
  </div>
  
  )
}
export default App