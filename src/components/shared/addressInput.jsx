import React, {useContext} from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'
import globalState from '../../context'

import Manager from '../../managers/manager'
import Label from './label'
import Spacer from './spacer'

export default function AddressInput({onChange = (e) => {}, defaultValue, labelText = '', required = false, wrapperClasses = ''}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  return (
    <>
      {Manager.isValid(process.env.REACT_APP_GOOGLE_MAPS_API_KEY, true) && (
        <>
          <div key={refreshKey} id="address-input-wrapper" className={`${wrapperClasses}`}>
            {/* LABEL */}
            {Manager.isValid(labelText, true) && (
              <Label classes={Manager.isValid(defaultValue) ? 'active' : ''} text={`${labelText}`} required={required} />
            )}

            {/* INPUT */}
            <GooglePlacesAutocomplete
              apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
              className={'address-input'}
              selectProps={{
                placeholder: defaultValue,
                blurInputOnSelect: true,
                backspaceRemovesValue: true,
                controlShouldRenderValue: true,
                isClearable: true,

                onChange: (e) => {
                  if (Manager.isValid(e?.label, true)) {
                    onChange(e?.label)
                  } else {
                    onChange('')
                  }
                },
              }}
            />
          </div>
          <Spacer height={5} />
        </>
      )}
    </>
  )
}