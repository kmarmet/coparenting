import React, {useContext, useEffect} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'

const Overlay = ({children, show}) => {
  const {state, setState} = useContext(globalState)
  const {menuIsOpen, showScreenActions, showCreationMenu} = state

  const HideOverlay = (e) => {
    const overlay = e.target
    if (Manager.IsValid(overlay) && overlay.classList.contains('screen-overlay')) {
      overlay.classList.remove('active')
      const allFadeElements = overlay?.querySelectorAll('.animate__fadeInUp')
      if (Manager.IsValid(allFadeElements)) {
        for (let el of allFadeElements) {
          el.classList.remove('animate__fadeInUp')
        }
      }
      setState({
        ...state,
        menuIsOpen: false,
        creationFormToShow: null,
        showCreationMenu: false,
        showScreenActions: false,
      })
    }
  }

  useEffect(() => {
    const appContentWithSidebar = document.querySelector('#app-content-with-sidebar')
    const pageContainer = document.querySelector('.page-container')

    if (show) {
      if (pageContainer) {
        pageContainer.classList.add('disable-scroll')
      }

      document.body.classList.add('disable-scroll')
      appContentWithSidebar?.classList?.add('disable-scroll')
    } else {
      if (pageContainer) {
        pageContainer.classList.remove('disable-scroll')
      }

      document.body.classList.remove('disable-scroll')
      appContentWithSidebar?.classList?.remove('disable-scroll')
    }
  }, [show])

  return (
    <div
      className={`screen-overlay ${show ? 'active gradient' : ''} ${menuIsOpen || showScreenActions || showCreationMenu ? 'blur' : ''}`}
      onClick={HideOverlay}>
      {children}
    </div>
  )
}

export default Overlay