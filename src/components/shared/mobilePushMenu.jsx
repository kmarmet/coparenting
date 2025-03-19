import React, { useContext } from 'react'
import globalState from '../../context'

const MobilePushMenu = ({ children }) => {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  return <div id="mobile-push-menu">{children}</div>
}

export default MobilePushMenu