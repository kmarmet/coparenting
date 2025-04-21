import React, {useContext} from 'react'
import Autocomplete from 'react-google-autocomplete'
import globalState from '../../context'

export default function AddressInput({onSelection = (e) => {}, defaultValue}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey, theme} = state
  return (
    <Autocomplete
      defaultValue={defaultValue}
      apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
      placeholder={''}
      options={{
        types: ['geocode', 'establishment'],
        componentRestrictions: {country: 'usa'},
      }}
      // key={refreshKey}
      onPlaceSelected={(place) => onSelection(place.formatted_address)}
    />
  )
}