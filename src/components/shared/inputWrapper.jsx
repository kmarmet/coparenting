import Label from './label'

function InputWrapper({ children, labelText, inputType, required, onChange, defaultValue = '' }) {
  const noInputTypes = ['location', 'textarea', 'date']

  return (
    <div
      id="input-wrapper"
      className={`${inputType === 'date' ? 'date' : ''} input-container`}
      onClick={(e) => e.currentTarget.classList.add('active')}>
      <Label text={labelText} classes="floating-label" required={required}></Label>
      {!noInputTypes.includes(inputType) && (
        <input type={inputType} placeholder={defaultValue.length > 0 ? defaultValue : labelText} onChange={onChange} />
      )}
      {noInputTypes.includes(inputType) && (
        <div className="w-100" onClick={(e) => e.currentTarget.parentNode.classList.add('active')}>
          {children}
        </div>
      )}
      {inputType === 'textarea' && (
        <textarea
          onClick={(e) => e.currentTarget.parentNode.classList.add('active')}
          placeholder={defaultValue.length > 0 ? defaultValue : labelText}
          cols="30"
          rows="10"></textarea>
      )}
    </div>
  )
}

export default InputWrapper
