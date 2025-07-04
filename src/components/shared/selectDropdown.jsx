import React, {useState} from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'

const animatedComponents = makeAnimated()

export default function SelectDropdown({
  value,
  wrapperClasses,
  uidClass = '',
  selectMultiple = false,
  onSelect = (e) => {},
  placeholder = '',
  options = [],
}) {
  const [defaultValue, setDefaultValue] = useState(value)

  return (
    <Select
      components={animatedComponents}
      placeholder={placeholder}
      isSearchable={false}
      isClearable={false}
      captureMenuScroll={false}
      blurInputOnSelect={false}
      closeMenuOnSelect={!selectMultiple}
      className={`${wrapperClasses} select-dropdown`}
      uidClass={uidClass}
      isMulti={selectMultiple}
      menuShouldScrollIntoView={false}
      value={defaultValue !== value ? value : defaultValue}
      onChange={onSelect}
      options={options}
    />
  )
}