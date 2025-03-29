import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'

const SuccessAlert = () => {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, successAlertMessage} = state
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (Manager.isValid(successAlertMessage, true)) {
      setShowAlert(true)
      setTimeout(() => {
        setTimeout(() => {
          setShowAlert(false)
          setTimeout(() => {
            setState({...state, successAlertMessage: null})
          }, 500)
        }, 1100)
      }, 700)
    }
  }, [successAlertMessage])
  return (
    <div id="success-alert-wrapper" className={showAlert ? 'active' : ''}>
      <p id="success-alert">{successAlertMessage}</p>
    </div>
  )
}

export default SuccessAlert