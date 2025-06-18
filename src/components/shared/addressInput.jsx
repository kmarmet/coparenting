import React, {useContext, useState} from 'react'
import Autocomplete from 'react-google-autocomplete'
import {FaMapLocationDot} from 'react-icons/fa6'
import globalState from '../../context'
import Manager from '../../managers/manager'
import CheckboxGroup from './checkboxGroup'
import Spacer from './spacer'

export default function AddressInput({onChange = (e) => {}, defaultValue, labelText = '', required = false, wrapperClasses = ''}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [addressType, setAddressType] = useState('address')
  return (
    <>
      <>
        <div key={refreshKey} id="address-input-field" className={`${wrapperClasses}`}>
          <FaMapLocationDot className={'input-icon maps'} />
          <Autocomplete
            key={addressType}
            options={{
              types: [addressType === 'Address' ? 'address' : 'point_of_interest'], // <- only addresses
              componentRestrictions: {country: 'us'}, // optional: limit to US addresses
            }}
            defaultValue={defaultValue}
            apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            onPlaceSelected={(place) => onChange(place?.formatted_address)}
          />
        </div>
        <CheckboxGroup
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
            setAddressType(e.dataset.label)
          }}
          skipNameFormatting={true}
          parentLabel={labelText}
          required={required}
        />
        <Spacer height={5} />
      </>
    </>
  )
}