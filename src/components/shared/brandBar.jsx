// Path: src\components\shared\brandBar.jsx
import React, { useContext } from 'react'
import globalState from '../../context'
import { FaFaceSmile } from 'react-icons/fa6'
import ScreenNames from '../../constants/screenNames'
import StringManager from '../../managers/stringManager'
export default function BrandBar() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  return (
    <div id="brand-bar">
      <div id="content">
        <div id="left" onClick={() => setState({ ...state, currentScreen: ScreenNames.calendar })}>
          <img src={require('../../img/logo.png')} alt="Peaceful coParenting" id="logo" />
        </div>
        <div id="right" onClick={() => setState({ ...state, currentScreen: ScreenNames.account })}>
          <FaFaceSmile />
          <p id="name">{StringManager.getFirstNameOnly(currentUser?.name)}</p>
        </div>
      </div>
    </div>
  )
}