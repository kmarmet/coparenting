import React, {useContext} from 'react'
import globalState from '../../context'
import useUpdates from '../../hooks/useUpdates'
import Manager from '../../managers/manager'

const NotificationBadge = ({classes = ''}) => {
    const {state, setState} = useContext(globalState)
    const {theme, refreshKey} = state
    const {updates} = useUpdates()

    return <span className={`notification-badge ${classes} ${Manager.IsValid(updates) ? 'active' : ''} ${theme}`}></span>
}

export default NotificationBadge