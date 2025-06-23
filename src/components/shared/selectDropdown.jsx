import React from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'

const animatedComponents = makeAnimated()

export default function SelectDropdown({
  value,
  wrapperClasses,
  uidClass = '',
  isMultiple: selectMultiple = false,
  onSelect = (e) => {},
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
        closeMenuOnSelect={!selectMultiple}
        className={`${wrapperClasses} select-dropdown`}
        uidClass={uidClass}
        isMulti={selectMultiple}
        menuShouldScrollIntoView={true}
        value={value}
        onChange={onSelect}
        options={options}
        onMenuOpen={(e) => {}}
      />
    </div>
  )
}