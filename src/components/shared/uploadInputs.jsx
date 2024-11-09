import React, { useContext } from 'react'
import globalState from '../../context'
import Label from './label'

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

  return (
    <div id="upload-inputs" className={containerClass}>
      <Label text="Upload Image(s)"></Label>
      <div className="flex">
        <label htmlFor="upload-input" className={`card-button primary green custom-file-upload  ${chooseImageClass}`}>
          {uploadButtonText}
        </label>
        <button className="card-button primary green" id="file-upload-button">
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
          className="button card-button  blue"
          onClick={() => {
            const files = document.getElementById('upload-input').files
            upload()
            getImages(files)
          }}>
          {actualUploadButtonText}
        </button>
      </div>
    </div>
  )
}

export default UploadInputs
