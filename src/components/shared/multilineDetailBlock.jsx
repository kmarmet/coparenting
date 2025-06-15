import React, {useContext, useState} from 'react'
import MultilineDetailBlockTypes from '../../constants/multilineDetailBlockTypes'
import globalState from '../../context'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'

const MultilineDetailBlock = ({array = [], title = '', dataType = MultilineDetailBlockTypes.Reminders}) => {
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
            {dataType === MultilineDetailBlockTypes.ShareWith && StringManager.GetFirstNameAndLastInitial(array[0])}
            {dataType === MultilineDetailBlockTypes.Reminders && StringManager.uppercaseFirstLetterOfAllWords(array[0])}
            {array.length > 1 && !showAll && <span className="ellipsis">...</span>}
          </p>
          <div className="rest-of-list-items">
            {array?.flat()?.map((arrItem, index) => {
              if (index < 1) return
              return (
                <div key={index}>
                  {dataType === MultilineDetailBlockTypes.ShareWith && (
                    <p className={`block-text`}>{StringManager.GetFirstNameAndLastInitial(arrItem)}</p>
                  )}
                  {dataType === MultilineDetailBlockTypes.Reminders && (
                    <p className={`block-text`}>{StringManager.uppercaseFirstLetterOfAllWords(arrItem)}</p>
                  )}
                </div>
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