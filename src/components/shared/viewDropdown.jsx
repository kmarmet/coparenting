import React, {useEffect} from 'react'
import ViewTypes from '../../constants/views'
import SelectDropdown from './selectDropdown'

export default function ViewDropdown({
  selectedView,
  views = ViewTypes.DetailsEdit.All,
  dropdownPlaceholder = '',
  onSelect = (e) => {},
  wrapperClasses = '',
  show = false,
}) {
  useEffect(() => {
    onSelect(selectedView)
  }, [selectedView])

  return (
    <div className={`${wrapperClasses} views-dropdown`}>
      <SelectDropdown
        options={views}
        wrapperClasses={`${wrapperClasses}`}
        value={selectedView}
        selectMultiple={false}
        className={wrapperClasses}
        placeholder={dropdownPlaceholder}
        onSelect={(e) => onSelect(e)}
        show={show}
      />
    </div>
  )
}