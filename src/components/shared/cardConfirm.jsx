import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import PopupCard from './popupCard'
import Manager from '@manager'
import BottomCard from './bottomCard'
import CalendarManager from '../../managers/calendarManager'

export default function CardConfirm({ className = '', title = '', message = '', onAccept, nevermind }) {
  const { state, setState } = useContext(globalState)
  const { showAlert, alertMessage, alertType } = state

  useEffect(() => {
    Manager.toggleForModalOrNewForm('show')
    console.log(className)
  }, [showAlert])

  return (
    <div id="card-confirm" className={className}>
      <p className="title">{CalendarManager.formatEventTitle(title)}</p>
      <p className="message">{message}</p>
      <div className="flex card-confirm-buttons">
        <button className="confirm" onClick={onAccept}>
          I'm Sure
        </button>
        <button className="nevermind" onClick={nevermind}>
          Nevermind
        </button>
      </div>
    </div>
  )
}
