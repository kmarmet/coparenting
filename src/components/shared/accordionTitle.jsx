import React from 'react'
import {LuMinus, LuPlus} from 'react-icons/lu'

const AccordionTitle = ({onClick, titleText, toggleState}) => {
  return (
    <button className="button default grey" onClick={onClick}>
      <span className={'label'}>
        {titleText} {toggleState ? <LuMinus /> : <LuPlus />}
      </span>
    </button>
  )
}

export default AccordionTitle