import React, {useContext, useEffect} from 'react'
import {useSwipeable} from 'react-swipeable'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Spacer from './spacer'

const ScreenActionsMenu = ({children, centeredActionItem, title = 'Parent', wrapperClasses = ''}) => {
    const {state, setState} = useContext(globalState)
    const {theme, showScreenActions} = state

    const handlers = useSwipeable({
        swipeDuration: 300,
        preventScrollOnSwipe: true,
        onSwipedDown: () => {
            setState({...state, showScreenActions: false})
        },
    })

    useEffect(() => {
        DomManager.ToggleDisableScrollClass(showScreenActions ? 'disable-scroll' : '')
    }, [showScreenActions])

    return (
        <div
            className={`bottom-card-wrapper screen-actions-menu-wrapper${showScreenActions ? ' active' : ''}${wrapperClasses ? ` ${wrapperClasses}` : ''}`}>
            <div className={`${showScreenActions ? ' active overlay' : ' overlay'} ${theme}`}></div>
            <div {...handlers} className={`screen-actions-card bottom-card`}>
                <div className={`${centeredActionItem ? 'centered action-items' : 'action-items'}${showScreenActions ? ' active' : ''}`}>
                    <p className="bottom-card-title">{title}</p>
                    <Spacer height={10} />
                    {children}
                </div>
            </div>
        </div>
    )
}

export default ScreenActionsMenu