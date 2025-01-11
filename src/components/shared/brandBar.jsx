import React, { useContext } from 'react'
import { contains, formatNameFirstNameOnly } from '../../globalFunctions'
import globalState from '../../context'
import { PiUserCircleDuotone } from 'react-icons/pi'
import ScreenNames from 'constants/screenNames'

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
          <PiUserCircleDuotone />
          <p id="name">{formatNameFirstNameOnly(currentUser?.name)}</p>
        </div>
      </div>
    </div>
  )
}