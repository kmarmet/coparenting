import FormControl from '@mui/material/FormControl'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import React from 'react'
import {IoCheckmarkSharp} from 'react-icons/io5'
import Manager from '../../managers/manager.js'
import Label from './label.jsx'
import Spacer from './spacer'

export default function SelectDropdown({wrapperClasses, isMultiple = false, onChange, labelText = '', id, options = [], selectValue = ''}) {
  return (
    <div className={wrapperClasses}>
      {Manager.IsValid(labelText) && <Label text={labelText} />}
      <Spacer height={2} />
      <FormControl fullWidth>
        <Select
          displayEmpty
          label={!Manager.IsValid(selectValue, true) ? labelText : ''}
          multiple={isMultiple}
          // label={'test'}
          id={id}
          className={'w-100'}
          value={selectValue}
          onChange={onChange}>
          {options?.map((item, index) => (
            <MenuItem
              key={index}
              value={item}
              onClick={(e) => {
                if (isMultiple) {
                  const row = e.target.closest('.MuiMenuItem-root')
                  const checkbox = row.querySelector('.checkbox')
                  if (Manager.IsValid(row)) {
                    row.classList.toggle('selected')

                    if (Manager.IsValid(checkbox)) {
                      checkbox.classList.toggle('checked')
                    }
                  }
                }
              }}>
              {isMultiple && (
                <div className="checkbox">
                  <IoCheckmarkSharp />
                </div>
              )}
              <ListItemText primary={item} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  )
}