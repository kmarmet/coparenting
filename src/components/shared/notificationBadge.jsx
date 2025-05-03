import React, {useContext} from 'react'
import globalState from '../../context'
import useNotifications from '../../hooks/useNotifications'
import Manager from '../../managers/manager'

const NotificationBadge = ({classes = ''}) => {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const {notifications} = useNotifications()

  return <div className={`notification-badge ${classes} ${Manager.isValid(notifications) ? 'active' : ''} ${theme}`}></div>
}

export default NotificationBadge