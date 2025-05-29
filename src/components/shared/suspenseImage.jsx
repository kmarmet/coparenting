import React, {Suspense, useContext} from 'react'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import {useLongPress} from 'use-long-press'

const SuspenseImage = ({classes = '', onClick = () => {}, shouldUseLongPress = false}) => {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen, authUser} = state
  const bind = useLongPress((element) => {
    setState({...state, currentScreen: ScreenNames.login})
  })
  return (
    <Suspense fallback={'Loading...'}>
      {shouldUseLongPress && <div className={`img ${classes}`} {...bind()} onClick={onClick}></div>}
      {!shouldUseLongPress && <div className={`img ${classes}`} onClick={onClick}></div>}
    </Suspense>
  )
}

export default SuspenseImage