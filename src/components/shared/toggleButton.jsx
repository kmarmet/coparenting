import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'

function ToggleButton({isDefaultChecked = false, onCheck = () => {}, onUncheck = () => {}}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [checked, setChecked] = useState(isDefaultChecked)

  useEffect(() => {
    setChecked(isDefaultChecked)
  }, [isDefaultChecked])

  return (
    <div className="toggle-button-wrapper">
      <div id="toggle-button">
        <input
          type="checkbox"
          className="checkbox"
          checked={checked}
          key={refreshKey}
          onChange={(e) => {
            if (checked) {
              if (onUncheck) {
                const parent = e.target.closest('.MuiPaper-root')
                if (Manager.isValid(parent)) {
                  const checkboxParent = parent.querySelector('.MuiCollapse-root')

                  if (Manager.isValid(checkboxParent)) {
                    const checkboxes = checkboxParent.querySelectorAll('.checkbox-wrapper')

                    if (Manager.isValid(checkboxes)) {
                      if (Manager.isValid(checkboxes)) {
                        checkboxes.forEach((x) => x.classList.remove('active'))
                      }
                    }
                  }
                }
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