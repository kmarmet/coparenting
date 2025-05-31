import React, {Suspense, useContext} from 'react'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import {useLongPress} from 'use-long-press'

const SuspenseImage = ({classes = '', onClick = () => {}}) => {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen, authUser} = state
  const bind = useLongPress((element) => {
    setState({...state, currentScreen: ScreenNames.login})
  })
  return (
    <Suspense fallback={'Loading...'}>
      {currentScreen === ScreenNames.login && <div className={`img ${classes}`} onClick={onClick} {...bind()}></div>}
      {currentScreen !== ScreenNames.login && <div className={`img ${classes}`} onClick={onClick}></div>}
    </Suspense>
  )
}

export default SuspenseImage