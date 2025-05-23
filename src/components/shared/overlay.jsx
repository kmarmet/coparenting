import React, {useContext, useEffect} from 'react'
import globalState from '../../context'

const Overlay = ({children, show}) => {
  const {state, setState} = useContext(globalState)
  const {menuIsOpen, showScreenActions, showCreationMenu} = state

  useEffect(() => {
    const appContentWithSidebar = document.querySelector('#app-content-with-sidebar')
    const pageContainer = document.querySelector('.page-container')
    if (show) {
      if (pageContainer) {
        pageContainer.classList.add('disable-scroll')
      }

      document.body.classList.add('disable-scroll')
      appContentWithSidebar.classList.add('disable-scroll')
    } else {
      if (pageContainer) {
        pageContainer.classList.remove('disable-scroll')
      }

      document.body.classList.remove('disable-scroll')
      appContentWithSidebar.classList.remove('disable-scroll')
    }
  }, [show])

  return (
    <>
      <div
        className={`page-overlay${show ? ' active' : ''} ${menuIsOpen || showScreenActions || showCreationMenu ? 'blur' : ''}`}
        onClick={() => {
          // const overlay = e.currentTarget
          // if (Manager.IsValid(overlay) && (overlay?.classList.contains('overlay-wrapper') || overlay?.classList.contains('creation-menu'))) {
          //   const allFadeElements = overlay?.querySelectorAll('.animate__fadeInUp')
          //   console.log(overlay)
          //   if (Manager.IsValid(allFadeElements)) {
          //     for (let el of allFadeElements) {
          //       el.classList.remove('animate__fadeInUp')
          //       el.classList.remove('animate__animated', 'animate__fadeOutDown')
          //     }
          //   }
          //   setState({
          //     ...state,
          //     menuIsOpen: false,
          //     creationFormToShow: null,
          //     showCreationMenu: false,
          //     showScreenActions: false,
          //   })
          // }
        }}>
        {children}
      </div>
    </>
  )
}

export default Overlay