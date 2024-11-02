import React, { useContext } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../context'
import { LuImagePlus } from 'react-icons/lu'

function UploadInputs({
  upload,
  uploadButtonText = 'Choose File',
  chooseImageClass = '',
  containerClass = '',
  getImages = () => {},
  actualUploadButtonText = 'Upload',
  uploadType = 'document',
  onClose,
}) {
  const { state, setState } = useContext(globalState)
  const { currentUser, currentScreen } = state

  const getIcon = () => {
    if (currentScreen === ScreenNames.memories) {
      return <LuImagePlus className={'fs-20 pl-5'} />
    }
  }

  return (
    <div id="upload-inputs" className={containerClass}>
      <div className="buttons">
        <label htmlFor="upload-input" className={`card-button custom-file-upload  ${chooseImageClass}`}>
          {uploadButtonText} {getIcon()}
        </label>
        <button id="file-upload-button">
          <label>Upload</label>
          <input
            onChange={() => getImages(document.getElementById('upload-input').files)}
            id="upload-input"
            name="file-upload"
            type="file"
            multiple
            accept={uploadType === 'document' ? '.docx' : 'image/*'}
          />
        </button>
        <button
          id="upload-button"
          className="button card-button  green"
          onClick={() => {
            const files = document.getElementById('upload-input').files
            upload()
            getImages(files)
          }}>
          {actualUploadButtonText} <span className="material-icons-round">upload</span>
        </button>
        <button className="card-button cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default UploadInputs
