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
  required = false,
}) {
  const [defaultValue, setDefaultValue] = useState(value)

  return (
    <div className={wrapperClasses}>
      <Select
        required={required}
        components={animatedComponents}
        placeholder={`${placeholder}${required ? ' (required)' : ''}`}
        isSearchable={false}
        isClearable={false}
        captureMenuScroll={false}
        blurInputOnSelect={false}
        closeMenuOnSelect={!selectMultiple}
        className={`${wrapperClasses} select-dropdown`}
        uidClass={uidClass}
        isMulti={selectMultiple}
        menuShouldScrollIntoView={true}
        value={defaultValue !== value ? value : defaultValue}
        onChange={onSelect}
        options={options}
        onMenuOpen={(e) => {}}
      />
    </div>
  )
}