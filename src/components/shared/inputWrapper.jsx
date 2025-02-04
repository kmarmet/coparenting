import React, { useContext, useEffect } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Label from './label'
import Manager from '../../managers/manager'
import globalState from '../../context.js'
import moment from 'moment'

function InputWrapper({
  wrapperClasses = '',
  children,
  labelText,
  inputType = 'input',
  required,
  onChange,
  defaultValue = '',
  inputClasses = '',
  inputValueType = 'text',
  placeholder = '',
  isDebounced = true,
  useNativeDate = false,
}) {
  const { state, setState } = useContext(globalState)
  const { currentUser, refreshKey } = state
  const noInputTypes = ['location', 'textarea', 'date']
  useEffect(() => {
    const inputWrapper = document.getElementById('input-wrapper')
    if (inputWrapper) {
      inputWrapper.addEventListener('blur', (el) => {
        el.classList.remove('active')
      })
      inputWrapper.addEventListener('focus', (el) => {
        el.classList.add('active')
      })
    }
  }, [])

  return (
    <div id="input-wrapper" className={`${wrapperClasses} ${inputType}  input-container form`}>
      {Manager.isValid(labelText) && <Label text={`${labelText}`} required={required} />}
      {!noInputTypes.includes(inputType) && (
        <>
          <DebounceInput
            value={defaultValue}
            element={inputType}
            minLength={2}
            placeholder={placeholder}
            className={`${inputClasses} ${defaultValue.length > 0 ? 'mb-0' : ''}`}
            onChange={onChange}
            debounceTimeout={isDebounced ? 800 : 0}
            key={refreshKey}
            type={inputValueType}
            pattern={inputValueType === 'tel' ? '[0-9]{3} [0-9]{3} [0-9]{4}' : ''}
            maxLength={inputValueType === 'tel' ? 12 : 100}
            onClick={(e) => e.target.scrollIntoView({ block: 'center' })}
          />
        </>
      )}

      {/* DATE/LOCATION */}
      {noInputTypes.includes(inputType) && useNativeDate && (
        <input value={moment(defaultValue).format('yyyy-MM-DD')} type="date" onChange={onChange} />
      )}
      {noInputTypes.includes(inputType) && !useNativeDate && <>{children}</>}

      {/* TEXTAREA */}
      {inputType === 'textarea' && (
        <textarea
          onClick={(e) => e.target.scrollIntoView({ block: 'center' })}
          onChange={onChange}
          className={inputClasses}
          cols="30"
          defaultValue={defaultValue}
          key={refreshKey}
          rows="10"
        />
      )}
    </div>
  )
}

export default InputWrapper