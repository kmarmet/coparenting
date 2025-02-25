import React, { useContext, useEffect, useState } from 'react'
import { HiOutlineDotsVertical } from 'react-icons/hi'
import globalState from '../../context'
import { IoClose } from 'react-icons/io5'

export default function Actions({ children, hide }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    if (hide === true) setShowActions(false)
  }, [hide])

  return (
    <div className={`actions ${showActions ? 'active' : ''}`}>
      <div className="actions-button-wrapper" onClick={() => setShowActions(!showActions)}>
        {showActions ? <IoClose className={'actions-button'} /> : <HiOutlineDotsVertical className={'actions-button'} />}
      </div>
      <div className={`children`}> {children}</div>
    </div>
  )
}