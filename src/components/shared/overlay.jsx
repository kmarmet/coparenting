import React, {useContext} from "react"
import globalState from "../../context"

const Overlay = ({children}) => {
      const {state, setState} = useContext(globalState)
      const {showOverlay, menuIsOpen, showCreationMenu} = state

      const HideOverlay = () => {
            // ToggleOverlay('hide')
            setState((prev) => ({
                  ...prev,
                  menuIsOpen: false,
                  creationFormToShow: null,
                  showCreationMenu: false,
                  showScreenActions: false,
                  showOverlay: false,
            }))
      }

      return (
            <div
                  id={"overlay"}
                  className={`${showOverlay === true ? "show" : ""}${showCreationMenu || showOverlay ? " with-card" : ""}${menuIsOpen ? " with-menu" : ""}`}
                  onClick={HideOverlay}>
                  {children}
            </div>
      )
}

export default Overlay