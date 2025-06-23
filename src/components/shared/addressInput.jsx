import React, {useContext, useState} from 'react'
import {FaMapLocationDot} from 'react-icons/fa6'
import globalState from '../../context'
import Manager from '../../managers/manager'
import CheckboxGroup from './checkboxGroup'
import GoogleAutocomplete from './googleAutocomplete'
import Spacer from './spacer'

export default function AddressInput({
  onChange = (e) => {},
  showAddressTypeSelector = true,
  defaultValue,
  labelText = '',
  required = false,
  wrapperClasses = '',
}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [addressType, setAddressType] = useState('address')

  const ClearInput = () => {
    const input = document.querySelector('.google-autocomplete-input')
    input.value = ''
  }

  return (
    <>
      <div key={refreshKey} className={`${wrapperClasses} address-input-field`}>
        <div className={'background'}>
          <FaMapLocationDot className={'input-icon maps'} />
          <GoogleAutocomplete onChange={onChange} defaultValue={defaultValue} addressType={addressType} />
        </div>
        <span onClick={ClearInput}>Clear</span>
      </div>
      {showAddressTypeSelector && (
        <CheckboxGroup
          elClass={wrapperClasses}
          checkboxArray={[
            {label: 'Address', key: 'address', isActive: addressType === 'address'},
            {label: 'Point of Interest', key: 'point_of_interest', isActive: addressType === 'point_of_interest'},
          ]}
          onCheck={(e) => {
            const parent = e.parentNode

            if (Manager.IsValid(parent)) {
              const allCheckboxWrappers = parent.querySelectorAll('.checkbox-wrapper')
              allCheckboxWrappers.forEach((wrapper) => {
                if (wrapper.dataset.label !== e.dataset.label) {
                  wrapper.classList.remove('active')
                } else {
                  wrapper.classList.add('active')
                }
              })
            }
            setAddressType(e.dataset.key)
          }}
          skipNameFormatting={true}
          parentLabel={labelText}
          required={required}
        />
      )}
      <Spacer height={5} />
    </>
  )
}