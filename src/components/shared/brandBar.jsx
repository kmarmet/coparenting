import React, { useContext } from 'react'
import { contains, formatNameFirstNameOnly } from '../../globalFunctions'
import globalState from '../../context'

export default function BrandBar() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  return (
    <div id="brand-bar" className="flex">
      <div id="content">
        <img src={require('../../img/logo.png')} alt="Peaceful coParenting" id="logo" />
        <p id="brand-name">
          Peaceful <span>co</span>Parenting
        </p>
      </div>
    </div>
  )
}