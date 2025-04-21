import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'
import {IoClose} from 'react-icons/io5'
import StringManager from '../../managers/stringManager'

const SuccessAlert = () => {
  const {state, setState} = useContext(globalState)
  const {successAlertMessage} = state
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (Manager.isValid(successAlertMessage, true)) {
      setShowAlert(true)
      setTimeout(() => {
        setShowAlert(false)
        setTimeout(() => {
          setState({...state, successAlertMessage: null})
        }, 1000)
      }, 2200)
    }
  }, [successAlertMessage])
  return (
    <div id="success-alert-wrapper" onClick={() => setShowAlert(false)} className={showAlert ? 'active' : ''}>
      <p id="success-alert">{StringManager.FormatTitle(successAlertMessage)}</p>
      <IoClose className={'alert-close-icon'} />
    </div>
  )
}

export default SuccessAlert