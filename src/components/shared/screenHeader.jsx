import React, {useContext} from 'react'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringAsHtmlElement from './stringAsHtmlElement'

export default function ScreenHeader({title, screenDescription = '', children, wrapperClass = ''}) {
    const {state, setState} = useContext(globalState)
    const {theme, currentScreen} = state

    return (
        <div className={`screen-header ${theme} ${wrapperClass}`}>
            {!Manager.IsValid(children) && (
                <div className={`text ${DomManager.Animate.FadeInUp(title)}`}>
                    <StringAsHtmlElement text={title} classes="screen-title" />
                    {Manager.IsValid(screenDescription) && <StringAsHtmlElement text={screenDescription} classes="screen-description" />}
                </div>
            )}
            {children}
        </div>
    )
}