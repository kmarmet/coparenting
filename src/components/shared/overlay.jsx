import React, {useContext, useEffect} from 'react'
import {IoClose} from 'react-icons/io5'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'

const Overlay = ({children, show = false, uidClass}) => {
  const {state, setState} = useContext(globalState)
  const {menuIsOpen, showScreenActions, showCreationMenu} = state

  const GetScreenOverlay = () => {
    const appContainer = document.getElementById('app-container')
    if (!appContainer) return null
    const selector = `.screen-overlay${Manager.IsValid(uidClass, true) ? `.${uidClass}` : ''}`
    return appContainer.querySelector(selector)
  }

  const HideOverlay = () => {
    ToggleOverlay('hide')
    setState((prev) => ({
      ...prev,
      menuIsOpen: false,
      creationFormToShow: null,
      showCreationMenu: false,
      showScreenActions: false,
    }))
  }

  const ToggleOverlay = (mode = 'hide') => {
    const overlay = GetScreenOverlay()
    if (!Manager.IsValid(overlay)) return
    overlay.classList.remove('blur', 'gradient') // Always clear both

    if (mode === 'show' && (menuIsOpen || showScreenActions || showCreationMenu || show)) {
      // overlay.classList.add(show ? 'gradient' : 'blur')
    }
  }

  // Disable/enable scroll on mount/update
  useEffect(() => {
    DomManager.ToggleDisableScrollClass(show ? 'add' : 'remove')
  }, [show])

  // Show/hide overlay classes
  useEffect(() => {
    ToggleOverlay(show || menuIsOpen || showScreenActions || showCreationMenu ? 'show' : 'hide')
  }, [show, uidClass, menuIsOpen, showScreenActions, showCreationMenu])

  const overlayClass = `screen-overlay${Manager.IsValid(uidClass) ? ` ${uidClass}` : ''}`
  const shouldShowClose = menuIsOpen || showScreenActions || showCreationMenu

  return (
    <div className={overlayClass} onClick={HideOverlay}>
      {shouldShowClose && <IoClose className="close-overlay-icon" onClick={HideOverlay} />}
      {children}
    </div>
  )
}

export default Overlay