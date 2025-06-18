import React, {useContext, useState} from 'react'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'

const MultilineDetailBlock = ({array = [], title = ''}) => {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const [showAll, setShowAll] = useState(false)

  return (
    <>
      {Manager.IsValid(array) && (
        <div
          className="block"
          onClick={(e) => {
            const target = e.currentTarget
            const restOfList = target.querySelector(`.rest-of-list-items`)
            DomManager.ToggleActive(restOfList)
            setShowAll(!showAll)
          }}>
          <p className={`block-text list`}>
            {StringManager.FormatTitle(array[0], true)}
            {array?.length > 1 && !showAll && <span className="ellipsis">...</span>}
          </p>
          <div className="rest-of-list-items">
            {array?.map((arrItem, index) => {
              if (index < 1) return
              return (
                <p key={index} className={`block-text`}>
                  {StringManager.FormatTitle(arrItem, true)}
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