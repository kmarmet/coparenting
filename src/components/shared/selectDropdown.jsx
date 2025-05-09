import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import React from 'react'
import Manager from '../../managers/manager.js'
import Label from './label.jsx'
import Spacer from './spacer'

export default function SelectDropdown({wrapperClasses, onChange, labelText, id, children, selectValue}) {
  return (
    <div className={wrapperClasses}>
      {Manager.IsValid(labelText) && <Label text={labelText} />}
      <Spacer height={2} />
      <FormControl fullWidth>
        <Select id={id} className={'w-100'} value={selectValue} onChange={onChange}>
          {children}
        </Select>
      </FormControl>
    </div>
  )
}