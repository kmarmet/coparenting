import React, {useContext, useState} from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import globalState from '../../context'

const animatedComponents = makeAnimated()

export default function SelectDropdown({
  value,
  wrapperClasses,
  uidClass = '',
  selectMultiple = false,
  onSelect = (e) => {},
  placeholder = '',
  options = [],
}) {
  const {state, setState} = useContext(globalState)
  const {menuIsOpen, showScreenActions, showCreationMenu, showOverlay} = state

  // STATE
  const [defaultValue, setDefaultValue] = useState(value)

  // REF
  const selectRef = React.useRef(null)

  // CUSTOM STYLES
  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#2684FF' : 'transparent',
      boxShadow: state.isFocused ? '0 0 0 1px #2684FF' : null,
      '&:hover': {
        borderColor: state.isFocused ? '#2684FF' : '#aaa',
      },
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      transition: 'all 0.3s ease',
      borderRadius: '8px',
      backdropFilter: 'blur(8px)',
      gap: '8px',
      zIndex: state.isFocused ? 10 : 1,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: 'transparent',
      fontWeight: '500',
      width: 'calc(100% / 4)',
      padding: '8px 15px',
      margin: '0 5px',
      gap: '8px',
    }),
    placeholder: (base) => ({
      ...base,
      color: 'red !important',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 10,
      padding: '10px 0',
      backdropFilter: 'blur(8px)',
      backgroundColor: 'transparent',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      boxShadow: '#1e2939 0 8px 10px',
    }),
  }

  return (
    <Select
      ref={selectRef}
      styles={customStyles}
      components={animatedComponents}
      placeholder={placeholder}
      isSearchable={false}
      isClearable={false}
      captureMenuScroll={false}
      blurInputOnSelect={false}
      closeMenuOnSelect={!selectMultiple}
      className={`${wrapperClasses} select-dropdown`}
      uidClass={uidClass}
      isMulti={selectMultiple}
      menuShouldScrollIntoView={true}
      value={defaultValue !== value ? value : defaultValue}
      onChange={onSelect}
      options={options}
    />
  )
}