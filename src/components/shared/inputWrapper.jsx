import Label from './label'
import React from 'react'
import { DebounceInput } from 'react-debounce-input'

function InputWrapper({ children, labelText, inputType, required, onChange, defaultValue = '', inputClasses = '', refreshKey }) {
  const noInputTypes = ['location', 'textarea', 'date']

  return (
    <div key={refreshKey} id="input-wrapper" className={` ${inputType} input-container`} onClick={(e) => e.currentTarget.classList.add('active')}>
      <Label text={labelText} classes="floating-label" required={required}></Label>
      {!noInputTypes.includes(inputType) && (
        <DebounceInput
          element={inputType}
          minLength={2}
          className={inputClasses}
          placeholder={defaultValue.length > 0 ? defaultValue : labelText}
          onChange={onChange}
          debounceTimeout={500}
        />
      )}
      {noInputTypes.includes(inputType) && (
        <div className="w-100" onClick={(e) => e.currentTarget.parentNode.classList.add('active')}>
          {children}
        </div>
      )}
      {inputType === 'textarea' && (
        <textarea
          onChange={onChange}
          className={inputClasses}
          onClick={(e) => e.currentTarget.parentNode.classList.add('active')}
          placeholder={defaultValue.length > 0 ? defaultValue : labelText}
          cols="30"
          rows="10"></textarea>
      )}
    </div>
  )
}

export default InputWrapper
