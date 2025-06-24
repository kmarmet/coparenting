import React, {useContext, useEffect} from 'react'
import {IoClose} from 'react-icons/io5'
import globalState from '../../context'
import Manager from '../../managers/manager'

const SuccessAlert = () => {
  const {state, setState} = useContext(globalState)
  const {successAlertMessage, authUser, currentScreen} = state

  const Dismiss = () => {
    const successAlertWrapper = document.querySelector('#success-alert-wrapper')

    if (Manager.IsValid(successAlertWrapper)) {
      successAlertWrapper.classList.remove('animate__fadeInDown')
      successAlertWrapper.classList.remove('animate__fadeInUp')
      successAlertWrapper.classList.add('animate__fadeOutUp')
      setState({...state, successAlertMessage: null})
    }
  }

  useEffect(() => {
    const successAlertWrapper = document.getElementById('success-alert-wrapper')
    if (Manager.IsValid(successAlertMessage, true)) {
      successAlertWrapper.classList.add('active')
      setTimeout(() => {
        setTimeout(() => {
          setState({...state, successAlertMessage: null})
          successAlertWrapper.classList.remove('active')
          Dismiss()
        }, 500)
      }, 1500)
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