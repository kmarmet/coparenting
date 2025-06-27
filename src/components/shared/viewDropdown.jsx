import React, {useEffect} from 'react'
import ViewTypes from '../../constants/views'
import SelectDropdown from './selectDropdown'
import Spacer from './spacer'

export default function ViewDropdown({
                                       selectedView,
                                       views = ViewTypes.DetailsEdit.All,
                                       dropdownPlaceholder = '',
                                       onSelect = (e) => {
                                       },
                                       wrapperClasses = '',
                                       show = false,
                                       hasSpacer = false,
                                     }) {
  useEffect(() => {
    onSelect(selectedView)
  }, [selectedView])

  return (
    <div className={`${wrapperClasses} views-dropdown`}>
      {hasSpacer && <Spacer height={10} />}
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