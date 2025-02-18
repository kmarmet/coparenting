// Path: src\components\shared\modal.jsx
import React, { useContext, useEffect } from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'

const Modal = ({
  children,
  onClose,
  elClass = '',
  hasClose = true,
  closeOrCancel = 'close',
  hasNavigation = false,
  onNavigateForward,
  onNavigateBack,
}) => {
  const { state, setState } = useContext(globalState)

  useEffect(() => {
    Manager.showPageContainer('hide')
  }, [])

  return (
    <div className={`modal ${elClass}`}>
      <div className="modal-content">{children}</div>
      {hasClose === true && (
        <div id="modal-actions">
          {hasNavigation && (
            <span className="material-icons-round back-arrow" onClick={() => onNavigateBack('back')}>
              arrow_back_ios
            </span>
          )}
          {closeOrCancel && (
            <button
              onClick={() => {
                setState({ ...state, modalIsOpen: false })
                Manager.showPageContainer('show')
                onClose()
              }}
              className="button default close">
              {closeOrCancel.uppercaseFirstLetterOfAllWords()}
            </button>
          )}
          {hasNavigation && (
            <span className="material-icons-round forward-arrow" onClick={() => onNavigateForward('forward')}>
              arrow_forward_ios
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default Modal
