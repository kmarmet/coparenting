import React, {useContext, useEffect, useState} from 'react'
import {IoClose} from 'react-icons/io5'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'

const SuccessAlert = () => {
  const {state, setState} = useContext(globalState)
  const {successAlertMessage, authUser, currentScreen} = state
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (Manager.IsValid(successAlertMessage, true)) {
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
    <div id="success-alert-wrapper" onClick={() => setShowAlert(false)} className={`${DomManager.Animate.FadeInDown(showAlert)}`}>
      <p id="success-alert">{successAlertMessage}</p>
      <IoClose className={'alert-close-icon'} />
    </div>
  )
}

export default SuccessAlert