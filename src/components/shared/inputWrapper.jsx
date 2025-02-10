import moment from 'moment'
import React, { useContext, useEffect } from 'react'
import { DebounceInput } from 'react-debounce-input'
import globalState from '../../context.js'
import Manager from '../../managers/manager'
import Label from './label'

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
  childrenOnly = false,
  isDebounced = true,
  useNativeDate = false,
  customDebounceDelay = 800,
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
    <div
      onClick={(e) => {
        const wrapper = e.currentTarget
        if (wrapper) {
          wrapper.classList.add('active')
          wrapper.querySelector('#label-wrapper').classList.add('active')
        }
      }}
      id="input-wrapper"
      className={`${wrapperClasses} ${inputType}  input-container form`}>
      {Manager.isValid(labelText) && <Label text={`${labelText}`} required={required} />}
      {!noInputTypes.includes(inputType) && (
        <>
          <DebounceInput
            value={defaultValue}
            element={inputType}
            minLength={2}
            placeholder={labelText}
            className={`${inputClasses} ${defaultValue.length > 0 ? 'mb-0' : ''}`}
            onChange={onChange}
            onBlur={(e) => {
              const input = e.target
              const labelWrapper = input.parentNode.querySelector('#label-wrapper')
              if (input.value.length === 0) {
                labelWrapper.classList.remove('active')
                input.placeholder = labelText
              }
            }}
            debounceTimeout={isDebounced ? (customDebounceDelay ? customDebounceDelay : 800) : 0}
            key={refreshKey}
            type={inputValueType}
            pattern={inputValueType && inputValueType === 'tel' ? '[0-9]{3} [0-9]{3} [0-9]{4}' : ''}
            maxLength={inputValueType && inputValueType === 'tel' ? 12 : 100}
          />
        </>
      )}

      {/* DATE/LOCATION */}
      {noInputTypes.includes(inputType) && useNativeDate && (
        <input onClick={(e) => {}} defaultValue={moment(defaultValue).format('yyyy-MM-DD')} type="date" onChange={onChange} />
      )}
      {noInputTypes.includes(inputType) && !useNativeDate && <> {children}</>}
      {childrenOnly && <>{children}</>}

      {/* TEXTAREA */}
      {inputType === 'textarea' && (
        <textarea
          placeholder={labelText}
          onChange={onChange}
          className={inputClasses}
          cols="30"
          defaultValue={defaultValue}
          key={refreshKey}
          rows="10"
          onBlur={(e) => {
            const input = e.target
            const labelWrapper = input.parentNode.querySelector('#label-wrapper')
            if (input.value.length === 0) {
              labelWrapper.classList.remove('active')
              input.placeholder = labelText
            }
          }}
        />
      )}
    </div>
  )
}

export default InputWrapper