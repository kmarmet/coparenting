import React, {useContext} from 'react'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringAsHtmlElement from './stringAsHtmlElement'

export default function ScreenHeader({title, screenDescription = '', children, wrapperClass = '', titleIcon = null}) {
    const {state, setState} = useContext(globalState)
    const {theme, currentScreen} = state

    return (
        <div className={`screen-header ${theme} ${wrapperClass}`}>
            {!Manager.IsValid(children) && (
                <div className={`text ${DomManager.Animate.FadeInUp(title)}`}>
                    <p className="screen-title">
                        {title}
                        {titleIcon ? <span className="svg-wrapper">{titleIcon}</span> : null}
                    </p>

                    {Manager.IsValid(screenDescription) && <StringAsHtmlElement text={screenDescription} classes="screen-description" />}
                </div>
            )}
            {children}
            <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                <path
                    fill="#5648FE"
                    fillOpacity="1"
                    d="M0,128L48,117.3C96,107,192,85,288,112C384,139,480,213,576,202.7C672,192,768,96,864,90.7C960,85,1056,171,1152,208C1248,245,1344,235,1392,229.3L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            </svg>
        </div>
    )
}