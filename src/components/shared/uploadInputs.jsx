import React, { useContext } from 'react'
import globalState from '../../context'

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
      <div className="flex">
        <input
          onChange={() => {
            const files = document.getElementById('upload-input').files
            upload()
            getImages(files)
          }}
          id="upload-input"
          name="file-upload"
          type="file"
          multiple
          accept={uploadType === 'document' ? '.docx' : 'image/*'}
        />
      </div>
    </div>
  )
}

export default UploadInputs
