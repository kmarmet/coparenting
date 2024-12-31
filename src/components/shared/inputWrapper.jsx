import React, { useEffect } from 'react'
import { DebounceInput } from 'react-debounce-input'
import Label from './label'
import Manager from '@manager'

function InputWrapper({
  wrapperClasses = '',
  children,
  labelText,
  inputType = 'input',
  required,
  onChange,
  defaultValue = '',
  inputClasses = '',
  refreshKey,
  inputValueType = 'text',
  placeholder = '',
}) {
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
      id="input-wrapper"
      //TODO fix spacing/margin
      className={`${wrapperClasses} ${inputType}  input-container`}>
      {Manager.isValid(labelText) && <Label text={`${labelText}`} required={required} />}
      {!noInputTypes.includes(inputType) && (
        <>
          {/* LABEL */}
          <DebounceInput
            value={defaultValue}
            element={inputType}
            minLength={2}
            placeholder={placeholder}
            className={`${inputClasses} ${defaultValue.length > 0 ? 'mb-0' : ''}`}
            onChange={onChange}
            debounceTimeout={800}
            key={refreshKey}
            type={inputValueType}
            onClick={(e) => e.target.scrollIntoView({ block: 'center' })}
          />
        </>
      )}

      {/* DATE/LOCATION */}
      {noInputTypes.includes(inputType) && <div className={`w-100`}>{children}</div>}

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