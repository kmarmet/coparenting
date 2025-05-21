import React, {useContext} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'
import StringAsHtmlElement from './stringAsHtmlElement'

export default function ScreenHeader({title, screenDescription = '', children, wrapperClass = ''}) {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen} = state

  return (
    <div className={`screen-header ${theme} ${wrapperClass}`}>
      {!Manager.IsValid(children) && (
        <div className="text">
          <StringAsHtmlElement text={title} classes="screen-title" />
          {Manager.IsValid(screenDescription) && <StringAsHtmlElement text={screenDescription} classes="screen-description" />}
        </div>
      )}
      {children}
    </div>
  )
}