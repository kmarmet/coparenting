import React, {useContext, useState} from 'react'
import globalState from '../../context'

function ToggleButton({isDefaultChecked = false, onCheck = () => {}, onUncheck = () => {}}) {
  const {state, setState} = useContext(globalState)
  const {currentUser, theme, refreshKey} = state
  const [checked, setChecked] = useState(isDefaultChecked)
  return (
    <div className="toggle-button-wrapper">
      <div id="toggle-button">
        <input
          type="checkbox"
          className="checkbox"
          checked={checked}
          key={refreshKey}
          onChange={() => {
            if (checked) {
              if (onUncheck) {
                onUncheck()
              }
            } else {
              if (onCheck) {
                onCheck()
              }
            }
            setChecked(!checked)
          }}
        />
        <div className="knobs">
          <span></span>
        </div>
        <div className="layer"></div>
      </div>
    </div>
  )
}

export default ToggleButton