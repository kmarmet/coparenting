import React, {useContext} from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import {FaMapLocationDot} from 'react-icons/fa6'
import globalState from '../../context'
import Manager from '../../managers/manager'

export default function AddressInput({onChange = (e) => {}, defaultValue, labelText = '', required = false, wrapperClasses = ''}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  return (
    <>
      <>
        <div key={refreshKey} id="address-input-wrapper" className={`${wrapperClasses}`}>
          {/* INPUT */}
          <FaMapLocationDot className={'input-icon'} />
          <GooglePlacesAutocomplete
            /* eslint-disable-next-line no-undef */
            apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            className={'address-input'}
            defaultValue={'test'}
            selectProps={{
              placeholder: `Address`,
              blurInputOnSelect: true,
              backspaceRemovesValue: true,
              controlShouldRenderValue: true,
              isClearable: true,

              onChange: (e) => {
                if (Manager.IsValid(e?.label, true)) {
                  onChange(e?.label)
                } else {
                  onChange('')
                }
              },
            }}
          />
        </div>
        {/* LABEL */}
        {/*{Manager.IsValid(labelText, true) && <Label classes={'address active input-wrapper-label'} text={`${labelText}`} required={required} />}*/}
      </>
    </>
  )
}