import React, { useContext, useState } from 'react'
import globalState from '../../../context'
import Manager from '@manager'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import DB_UserScoped from '@userScoped'

export default function CustomCoparentInfo({ hideCard, setActiveCoparent, activeCoparent }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [title, setTitle] = useState(null)
  const [value, setValue] = useState(null)

  const resetForm = () => {
    Manager.resetForm('custom-coparent-info-wrapper')
    setTitle('')
    setValue('')
    hideCard()
  }

  const add = async () => {
    const updatedCoparent = await DB_UserScoped.addCoparentProp(currentUser, activeCoparent, Manager.toCamelCase(title), value)
    resetForm()
    setActiveCoparent(updatedCoparent)
  }

  return (
    <div className="custom-coparent-info-wrapper">
      <div className={`${theme} form`}>
        <>
          <input className="mb-5" type="text" placeholder="Title/Label*" onChange={(e) => setTitle(e.target.value)} />
          <input className="mb-5" type="text" placeholder="Value*" onChange={(e) => setValue(e.target.value)} />
          {Manager.validation([title, value]) === 0 && (
            <div className="buttons">
              <button className="card-button" onClick={add}>
                Add<span className="ml-10 material-icons-outlined">auto_fix_high</span>
              </button>
            </div>
          )}
        </>
      </div>
    </div>
  )
}
