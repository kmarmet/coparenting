// Path: src\components\shared\inputWrapper.jsx
import React, {useContext} from 'react'
import {DebounceInput} from 'react-debounce-input'
import globalState from '../../context.js'
import Manager from '../../managers/manager'
import {MobileDatePicker, MobileTimePicker} from '@mui/x-date-pickers-pro'
import Label from './label'
import InputTypes from '../../constants/inputTypes'
import moment from 'moment'
import DatetimeFormats from '../../constants/datetimeFormats'
import AddressInput from './addressInput'
import Spacer from './spacer'

function InputWrapper({
  wrapperClasses = '',
  labelText,
  inputType = 'input',
  required,
  onChange,
  defaultValue = null,
  inputClasses = '',
  onDateOrTimeSelection = (e) => {},
  isDebounced = true,
}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey, theme} = state

  return (
    <>
      <div
        onClick={(e) => {
          const wrapper = e.currentTarget
          if (wrapper) {
            wrapper.classList.add('active')
          }
        }}
        onBlur={(e) => {
          const wrapper = e.currentTarget
          wrapper.classList.remove('active')
        }}
        id="input-wrapper"
        className={`${wrapperClasses}  ${inputType} ${Manager.isValid(defaultValue) ? 'show-label' : ''}`}>
        {/* LABEL */}
        {Manager.isValid(labelText) && <Label classes={Manager.isValid(defaultValue) ? 'active' : ''} text={`${labelText}`} required={required} />}

        {/* TEXT */}
        {inputType === InputTypes.text && (
          <DebounceInput
            value={Manager.isValid(defaultValue) ? defaultValue : ''}
            placeholder={labelText}
            className={`${inputClasses}`}
            onChange={onChange}
            debounceTimeout={isDebounced ? 1000 : 0}
            key={refreshKey}
          />
        )}

        {/* PHONE */}
        {inputType === InputTypes.phone && (
          <input
            type="tel"
            id="phone"
            name="phone"
            maxLength={16}
            placeholder={labelText}
            key={refreshKey}
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
            defaultValue={defaultValue}
            required={required}
            onChange={onChange}
          />
        )}

        {/* ADDRESS */}
        {inputType === InputTypes.address && <AddressInput defaultValue={defaultValue} onSelection={onChange} key={refreshKey} />}

        {/* DATE */}
        {inputType === InputTypes.date && (
          <MobileDatePicker
            showDaysOutsideCurrentMonth={true}
            label={labelText}
            views={['month', 'day']}
            className={`${theme} ${inputClasses}`}
            defaultValue={Manager.isValid(defaultValue) ? moment(defaultValue) : null}
            key={refreshKey}
            format={DatetimeFormats.readableMonthAndDay}
            onAccept={onDateOrTimeSelection}
          />
        )}

        {/* TIME */}
        {inputType === InputTypes.time && (
          <MobileTimePicker
            slotProps={{
              actionBar: {
                actions: ['clear', 'accept'],
              },
            }}
            value={Manager.isValid(defaultValue) ? moment(defaultValue, DatetimeFormats.timeForDb) : null}
            label={labelText}
            minutesStep={5}
            key={refreshKey}
            format={DatetimeFormats.timeForDb}
            onAccept={onDateOrTimeSelection}
          />
        )}

        {/* URL */}
        {inputType === InputTypes.url && (
          <input
            type="url"
            id="url"
            placeholder={labelText}
            onChange={(e) => {
              onChange(e)
            }}
            className={inputClasses}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}

        {/* EMAIL */}
        {inputType === InputTypes.email && (
          <input
            type="email"
            id="email"
            placeholder={labelText}
            onChange={(e) => {
              onChange(e)
            }}
            className={inputClasses}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}

        {/* PASSWORD */}
        {inputType === InputTypes.password && (
          <input
            type="password"
            id="password"
            placeholder={labelText}
            onChange={(e) => {
              onChange(e)
            }}
            className={inputClasses}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}

        {/* TEXTAREA */}
        {inputType === InputTypes.textarea && (
          <textarea
            id="textarea"
            placeholder={labelText}
            onChange={(e) => {
              onChange(e)
            }}
            className={inputClasses}
            defaultValue={defaultValue}
            key={refreshKey}
          />
        )}
      </div>
      <Spacer height={5} />
    </>
  )
}

export default InputWrapper