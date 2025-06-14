// Path: src\components\shared\viewSelector.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import SelectDropdown from './selectDropdown'

export default function ViewSelector({labels, dropdownPlaceholder = '', isMultiple = false, updateState, wrapperClasses = '', show = false}) {
  // APP STATE
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const [selected, setSelected] = useState()

  return (
    <div key={refreshKey} className={`${wrapperClasses} views-wrapper`}>
      <SelectDropdown
        options={DomManager.GetSelectOptions(labels)}
        wrapperClasses={`view-selector ${wrapperClasses}`}
        selectValue={selected}
        isMultiple={isMultiple}
        className={wrapperClasses}
        labelText={dropdownPlaceholder}
        onChange={(e) => {
          updateState(e.value)
          setSelected(e.value)
        }}
        show={show}
      />
    </div>
  )
}