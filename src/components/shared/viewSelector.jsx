// Path: src\components\shared\viewSelector.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../context'
import StringManager from '../../managers/stringManager'
import SelectDropdown from './selectDropdown'

export default function ViewSelector({labels, updateState, wrapperClasses = '', onloadState = ''}) {
  // APP STATE
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const [selected, setSelected] = useState()

  return (
    <div key={refreshKey} className={`${wrapperClasses} views-wrapper`}>
      <SelectDropdown
        options={labels.map((x) => StringManager.uppercaseFirstLetterOfAllWords(x))}
        wrapperClasses={'view-selector'}
        selectValue={selected}
        labelText={labels[0]}
        placeholder={labels[0]}
        onChange={(e) => {
          updateState(e.target.value.toLowerCase())
          setSelected(e.target.value)
        }}
        onloadState={true}
      />
    </div>
  )
}