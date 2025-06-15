import React from 'react'
import ViewTypes from '../../constants/views'
import SelectDropdown from './selectDropdown'

export default function ViewDropdown({
  selectedView = ViewTypes.DetailsEdit.Details,
  views = ViewTypes.DetailsEdit.All,
  dropdownPlaceholder = '',
  isMultiple = false,
  updateState = (e) => {},
  wrapperClasses = '',
  show = false,
}) {
  return (
    <div className={`${wrapperClasses} views-dropdown`}>
      <SelectDropdown
        options={views}
        wrapperClasses={`${wrapperClasses}`}
        value={selectedView}
        isMultiple={isMultiple}
        className={wrapperClasses}
        placeholder={dropdownPlaceholder}
        onSelection={(e) => {
          updateState(e.label)
        }}
        show={show}
      />
    </div>
  )
}