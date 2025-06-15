import React from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'

const animatedComponents = makeAnimated()

export default function SelectDropdown({
  value,
  wrapperClasses,
  uidClass = '',
  isMultiple = false,
  onSelection = (e) => {},
  placeholder = '',
  options = [],
}) {
  return (
    <div className={wrapperClasses}>
      <Select
        required={true}
        components={animatedComponents}
        placeholder={placeholder}
        isSearchable={false}
        isClearable={false}
        captureMenuScroll={false}
        blurInputOnSelect={false}
        closeMenuOnSelect={!isMultiple}
        className={`${wrapperClasses} select-dropdown`}
        uidClass={uidClass}
        isMulti={isMultiple}
        menuShouldScrollIntoView={true}
        value={value}
        onChange={onSelection}
        options={options}
        onMenuOpen={(e) => {}}
      />
    </div>
  )
}