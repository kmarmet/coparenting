import React from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete'

export default function AddressInput({onChange = (e) => {}, defaultValue, labelText = '', required = false, value}) {
  return (
    <div id="address-input-wrapper">
      {/* LABEL */}
      {/*{Manager.isValid(labelText, true) && (*/}
      {/*  <Label classes={Manager.isValid(defaultValue) ? 'active' : ''} text={`${labelText}`} required={required} />*/}
      {/*)}*/}

      {/* INPUT */}
      <GooglePlacesAutocomplete
        apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        className={'address-input'}
        selectProps={{
          value: value,
          placeholder: defaultValue,
          onChange: (e) => {
            console.log(e)
          },
          isClearable: true,
        }}
      />
    </div>
  )
}