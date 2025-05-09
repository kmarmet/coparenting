import React from 'react'
import Manager from '../../managers/manager'

const MultilineDetailBlock = ({array, title}) => {
  return (
    <>
      {Manager.IsValid(array) && (
        <div className="block">
          {array.map((arrItem, index) => {
            return (
              <p className="block-text" key={index}>
                {arrItem}
              </p>
            )
          })}
          <p className="block-title">{title}</p>
        </div>
      )}
    </>
  )
}

export default MultilineDetailBlock