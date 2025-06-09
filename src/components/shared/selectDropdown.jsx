// import Select from '@mui/material/Select'
import Select from 'react-select'
import React from 'react'
import Manager from '../../managers/manager.js'
import Label from './label.jsx'
import Spacer from './spacer'
import makeAnimated from 'react-select/animated'

export default function SelectDropdown({wrapperClasses, isMultiple = false, onChange, labelText = '', options = [], selectValue = ''}) {
  const animatedComponents = makeAnimated()
  return (
    <div
      className={wrapperClasses}
      onClick={(e) => {
        console.log('here')
      }}>
      {Manager.IsValid(labelText) && <Label text={labelText} />}
      <Spacer height={2} />
      <Select
        components={animatedComponents}
        placeholder={labelText}
        loadingMessage={'Loading...'}
        isSearchable={false}
        isClearable={false}
        captureMenuScroll={false}
        closeMenuOnSelect={false}
        className={wrapperClasses}
        isMulti={isMultiple}
        emotion={'sad'}
        menuShouldScrollIntoView={true}
        defaultChecked={selectValue}
        onChange={onChange}
        options={options}
      />
    </div>
  )
}