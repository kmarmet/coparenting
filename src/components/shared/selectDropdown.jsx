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
    <div className={wrapperClasses}>
      {Manager.IsValid(labelText) && <Label text={labelText} />}
      <Spacer height={2} />
      {/*isClearable={true}*/}
      <Select
        components={animatedComponents}
        placeholder={labelText}
        loadingMessage={'Loading...'}
        isSearchable={true}
        captureMenuScroll={false}
        closeMenuOnSelect={false}
        className={wrapperClasses}
        isMulti={isMultiple}
        type={'checkbox'}
        defaultChecked={selectValue}
        onChange={onChange}
        draggable={true}
        options={options}
      />

      {/*<FormControl fullWidth>*/}
      {/*  <Select*/}
      {/*    displayEmpty*/}
      {/*    // label={!Manager.IsValid(selectValue, true) ? labelText : ''}*/}
      {/*    multiple={isMultiple}*/}
      {/*    label={Manager.IsValid(options) > 0 ? options[0] : ''}*/}
      {/*    id={id}*/}
      {/*    className={wrapperClasses}*/}
      {/*    value={selectValue}*/}
      {/*    onChange={onChange}>*/}
      {/*    /!* LABEL *!/*/}
      {/*    /!*<MenuItem disabled value={labelText}>*!/*/}
      {/*    /!*  {labelText}*!/*/}
      {/*    /!*</MenuItem>*!/*/}
      {/*    {options?.map((item, index) => (*/}
      {/*      <MenuItem*/}
      {/*        key={index}*/}
      {/*        value={item}*/}
      {/*        onClick={(e) => {*/}
      {/*          if (isMultiple) {*/}
      {/*            const row = e.target.closest('.MuiMenuItem-root')*/}
      {/*            const checkbox = row.querySelector('.checkbox')*/}
      {/*            if (Manager.IsValid(row)) {*/}
      {/*              row.classList.toggle('selected')*/}

      {/*              if (Manager.IsValid(checkbox)) {*/}
      {/*                checkbox.classList.toggle('checked')*/}
      {/*              }*/}
      {/*            }*/}
      {/*          }*/}
      {/*        }}>*/}
      {/*        {isMultiple && (*/}
      {/*          <div className="checkbox">*/}
      {/*            <IoCheckmarkSharp />*/}
      {/*          </div>*/}
      {/*        )}*/}
      {/*        <ListItemText primary={item} />*/}
      {/*      </MenuItem>*/}
      {/*    ))}*/}
      {/*  </Select>*/}
      {/*</FormControl>*/}
    </div>
  )
}