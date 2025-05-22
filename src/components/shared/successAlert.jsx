import React, {useContext, useEffect, useState} from 'react'
import {IoClose} from 'react-icons/io5'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'

const SuccessAlert = () => {
  const {state, setState} = useContext(globalState)
  const {successAlertMessage} = state
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
      <p id="success-alert">{StringManager.FormatTitle(successAlertMessage)}</p>
      <IoClose className={'alert-close-icon'} />
    </div>
  )
}

export default SuccessAlert