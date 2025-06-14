import React, {useContext} from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import globalState from '../../context'
import Manager from '../../managers/manager.js'
import Label from './label.jsx'
import Spacer from './spacer'

const animatedComponents = makeAnimated()

export default function SelectDropdown({defaultValues, wrapperClasses, isMultiple = false, onChange, labelText = '', options = []}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey, dateToEdit} = state
  return (
    <div className={wrapperClasses}>
      {Manager.IsValid(labelText) && <Label text={labelText} />}
      <Spacer height={2} />
      <Select
        required={true}
        key={refreshKey}
        components={animatedComponents}
        placeholder={labelText}
        loadingMessage={'Loading...'}
        isSearchable={false}
        isClearable={false}
        captureMenuScroll={false}
        blurInputOnSelect={false}
        closeMenuOnSelect={!isMultiple}
        className={wrapperClasses}
        isMulti={isMultiple}
        menuShouldScrollIntoView={true}
        defaultValue={defaultValues}
        onChange={onChange}
        options={options}
      />
    </div>
  )
}