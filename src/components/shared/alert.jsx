import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import PopupCard from './popupCard'
import Manager from '@manager'
import BottomCard from './bottomCard'

export default function Alert({ className = '' }) {
  const { state, setState } = useContext(globalState)
  const { showAlert, alertMessage, alertType } = state

  useEffect(() => {
    if (alertMessage && alertMessage !== undefined && alertMessage.length > 0) {
      setTimeout(() => {
        setState({ ...state, showAlert: false, alertMessage: '', alertType: 'error' })
      }, 2500)
    }
  }, [alertMessage])

  useEffect(() => {
    if (!showAlert) {
      Manager.showPageContainer('show')
    }
  }, [showAlert])

  return (
    <>
      <BottomCard
        onClose={() => setState({ ...state, showAlert: false, alertMessage: '', alertType: 'error' })}
        title={alertMessage.contains('Updated') || alertMessage.contains('Event') ? 'Event Updated' : 'Success'}
        showCard={showAlert}
        className={`${alertType} ${className}`}>
        <p>{alertMessage}</p>
      </BottomCard>
    </>
  )
}
