import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import ScreenNames from '@screenNames'

export default function Loading({ isLoading }) {
  return (
    <div className={isLoading === true ? 'loading-overlay active' : 'loading-overlay'}>
      <img src={require('../../img/loading.gif')} alt="Loading" />
    </div>
  )
}
