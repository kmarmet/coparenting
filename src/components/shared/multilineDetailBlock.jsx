import React, {useContext} from 'react'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'

const MultilineDetailBlock = ({array = [], title = ''}) => {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state

  return (
    <>
      {Manager.IsValid(array) && (
        <div
          className="block"
          onClick={(e) => {
            const target = e.currentTarget
            const restOfList = target.querySelector(`.rest-of-list-items`)
            const ellipseElement = target.querySelector(`.ellipsis`)
            DomManager.toggleActive(restOfList)
            if (Manager.IsValid(ellipseElement)) {
              ellipseElement.classList.toggle('hide')
            }
          }}>
          <p className={`block-text list`}>
            {array[0]}
            {array.length > 1 && <span className="ellipsis">...</span>}
          </p>
          <div className="rest-of-list-items">
            {array.map((arrItem, index) => {
              if (index < 1) return
              return (
                <p className={`block-text`} key={index}>
                  {arrItem}
                </p>
              )
            })}
          </div>

          <p className="block-title">
            {title} {array.length > 1 ? `(${array.length})` : ''}
          </p>
        </div>
      )}
    </>
  )
}

export default MultilineDetailBlock