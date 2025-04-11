import React from 'react'
import Label from './label'
import {LuMinus, LuPlus} from 'react-icons/lu'

const AccordionTitle = ({onClick, titleText, toggleState}) => {
  return (
    <button className="button default grey" onClick={onClick}>
      <Label text={titleText} /> {toggleState ? <LuMinus /> : <LuPlus />}
    </button>
  )
}

export default AccordionTitle