import React, {useContext, useEffect} from 'react'
import {IoClose} from 'react-icons/io5'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'

const SuccessAlert = () => {
  const {state, setState} = useContext(globalState)
  const {successAlertMessage, authUser, currentScreen} = state

  const Dismiss = () => {
    const successAlertWrapper = document.querySelector('#success-alert-wrapper')
    successAlertWrapper.classList.remove('animate__fadeInDown')
    successAlertWrapper.classList.remove('animate__fadeInUp')
    successAlertWrapper.classList.add('animate__fadeOutUp')
    setState({...state, successAlertMessage: null})
  }

  useEffect(() => {
    if (Manager.IsValid(successAlertMessage, true)) {
      DomManager.ToggleAnimation('add', 'success-alert', DomManager.AnimateClasses.names.fadeInDown)
      setTimeout(() => {
        setTimeout(() => {
          setState({...state, successAlertMessage: null})
          Dismiss()
        }, 1000)
      }, 2200)
    }
  }, [successAlertMessage])

  return (
    <div id="success-alert-wrapper" onClick={Dismiss} className={`success-alert`}>
      <p className="success-alert-text">{successAlertMessage}</p>
      <IoClose className={'alert-close-icon'} />
    </div>
  )
}

export default SuccessAlert