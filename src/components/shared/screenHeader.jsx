import React, {useContext} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'
import StringAsHtmlElement from './stringAsHtmlElement'

export default function ScreenHeader({title, screenDescription = ''}) {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen} = state

  return (
    <div className="screen-header">
      <div className="text">
        <p className="screen-title">{title}</p>
        {Manager.IsValid(screenDescription) && <StringAsHtmlElement text={screenDescription} classes="screen-description" />}
      </div>
    </div>
  )
}