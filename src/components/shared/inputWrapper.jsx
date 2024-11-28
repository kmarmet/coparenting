import React, { useEffect } from 'react'
import { DebounceInput } from 'react-debounce-input'

function InputWrapper({
  wrapperClasses = '',
  children,
  labelText,
  inputType,
  required,
  onChange,
  defaultValue = '',
  inputClasses = '',
  refreshKey,
  inputValueType = 'text',
  inputValue = '',
}) {
  const noInputTypes = ['location', 'textarea', 'date']

  const getPlaceholder = () => {
    let text = defaultValue
    if (defaultValue.length === 0) {
      text = labelText
    }
    if (required) {
      text += '*'
    }

    return text
  }

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
    <div key={refreshKey} id="input-wrapper" className={`${wrapperClasses} ${inputType} input-container`}>
      {!noInputTypes.includes(inputType) && (
        <>
          <DebounceInput
            value={inputValue}
            element={inputType}
            minLength={2}
            className={inputClasses}
            placeholder={getPlaceholder()}
            onChange={onChange}
            debounceTimeout={800}
            type={inputValueType}
          />
        </>
      )}
      {noInputTypes.includes(inputType) && <div className="w-100">{children}</div>}
      {inputType === 'textarea' && (
        <textarea onChange={onChange} className={inputClasses} placeholder={getPlaceholder()} cols="30" rows="10"></textarea>
      )}
    </div>
  )
}

export default InputWrapper