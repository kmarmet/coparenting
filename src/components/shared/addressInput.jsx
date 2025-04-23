import React, {useContext} from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../context'
import Manager from '../../managers/manager'

export default function AddressInput({onSelection = (e) => {}, defaultValue}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey, theme} = state
  return (
    <Autocomplete
      defaultValue={defaultValue}
      apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
      placeholder={''}
      onKeyDown={(event) => {
        if (event.ctrlKey && event.key === 'a') {
          // Use setTimeout to check the input value after the copy action
          setTimeout(() => {
            if (event.target.value === '') {
              // console.log('Input cleared with Ctrl+C')
              onSelection('')
              // Add any further actions needed when input is cleared
            } else {
              // console.log('Ctrl+C pressed, but input was not cleared')
            }
          }, 500)
        }
      }}
      onChange={(e) => {
        const value = e.target.value
        if (Manager.isValid(value, true)) {
          const valueLength = value.length
          if (valueLength === 1) {
            onSelection('')
          }
        }
      }}
      options={{
        types: ['geocode', 'establishment'],
        componentRestrictions: {country: 'usa'},
      }}
      // key={refreshKey}
      onPlaceSelected={(place) => onSelection(place.formatted_address)}
    />
  )
}