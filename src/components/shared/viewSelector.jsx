import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import DomManager from '/src/managers/domManager'
import Spacer from './spacer'
import Manager from '../../managers/manager'

export default function ViewSelector({ labelOneText, labelTwoText, updateState, wrapperClasses, visibleLabels = [] }) {
  // APP STATE
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, refreshKey } = state

  const toggleActive = (el) => {
    const views = document.querySelectorAll('.view')
    views.forEach((view) => {
      view.classList.remove('active')
    })
    DomManager.toggleActive(el)
  }

  useEffect(() => {
    const labelOneElement = document.querySelector('[data-label-id="one"]')
    const labelTwoElement = document.querySelector('[data-label-id="two"]')
    if (Manager.isValid(visibleLabels)) {
      if (labelOneElement) {
        if (visibleLabels.includes(labelOneText) && !visibleLabels.includes(labelTwoText)) {
          labelOneElement.classList.add('active')
          labelTwoElement.classList.add('hide')
        }
      }
      if (labelTwoElement) {
        if (!visibleLabels.includes(labelOneText) && visibleLabels.includes(labelTwoText)) {
          labelOneElement.classList.add('hide')
          labelTwoElement.classList.add('active')
        }
      }
    }
  }, [visibleLabels])
  return (
    <>
      <Spacer height={10} />
      <div key={refreshKey} className={`${wrapperClasses} views-wrapper`}>
        <p
          data-label-id={'one'}
          className={`view active`}
          onClick={(el) => {
            updateState(labelOneText)
            toggleActive(el.target)
          }}>
          {labelOneText}
        </p>
        <p
          data-label-id={'two'}
          className={`view`}
          onClick={(el) => {
            updateState(labelTwoText)
            toggleActive(el.target)
          }}>
          {labelTwoText}
        </p>
      </div>
    </>
  )
}