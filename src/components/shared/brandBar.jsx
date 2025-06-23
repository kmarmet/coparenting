// Path: src\components\shared\brandBar.jsx
import React, {useContext} from 'react'
import {FaFaceSmile} from 'react-icons/fa6'
import AppImages from '../../constants/appImages'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import StringManager from '../../managers/stringManager'
import LazyImage from './lazyImage'

export default function BrandBar() {
  const {state, setState} = useContext(globalState)
  const {theme, currentUser} = state
  return (
    <div id="brand-bar">
      <div id="content">
        <div id="left" onClick={() => setState({...state, currentScreen: ScreenNames.calendar})}>
          <LazyImage classes={'logo'} imgName={AppImages.landing.logo.name} alt="Peaceful Co-Parenting" />
        </div>
        <div id="right" onClick={() => setState({...state, currentScreen: ScreenNames.profile})}>
          <FaFaceSmile />
          <p id="name">{StringManager.GetFirstNameOnly(currentUser?.name)}</p>
        </div>
      </div>
    </div>
  )
}