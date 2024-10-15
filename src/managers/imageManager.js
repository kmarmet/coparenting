import DB from '@db'
import FirebaseStorage from '@firebaseStorage'

const ImageManager = {
  expandImage: (img, modal) => {
    if (modal === undefined) {
      modal = document.querySelector('.image-modal')
    }
    const src = img.getAttribute('src')
    const imageModal = modal
    imageModal.querySelector('img').setAttribute('src', src)
    imageModal.classList.add('active')
  },
  formatImageName: (imageName) => {
    return imageName
      .replace(/\.[^/.]+$/, '')
      .replaceAll('-', ' ')
      .replaceAll('_', ' ')
      .uppercaseFirstLetterOfAllWords()
  },
  getCroppedImg: async (imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
    }

    const rotRad = getRadianAngle(rotation)

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation)

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)

    // draw rotated image
    ctx.drawImage(image, 0, 0)

    const croppedCanvas = document.createElement('canvas')

    const croppedCtx = croppedCanvas.getContext('2d')

    if (!croppedCtx) {
      return null
    }

    // Set the size of the cropped canvas
    croppedCanvas.width = pixelCrop.width
    croppedCanvas.height = pixelCrop.height

    // Draw the cropped image onto the new canvas
    croppedCtx.drawImage(canvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)

    // As Base64 string
    // return croppedCanvas.toDataURL('image/jpeg');

    // As a blob
    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob((file) => {
        resolve(file)
      }, 'image/jpeg')
    })
  },

  blobToImage: (blob) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob)
      let img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.src = url
      console.log(img)
    })
  },

  navigateToImage: (direction, imgPaths) => {
    const img = document.querySelector('#modal-img')
    const src = img.getAttribute('src')
    const imgIndex = imgPaths.indexOf(src)
    if (imgIndex > -1 && imgIndex + 1 < imgPaths.length) {
      if (direction === 'forward') {
        img.src = imgPaths[imgIndex + 1]
      } else {
        if (imgPaths[imgIndex - 1] === undefined) {
          img.src = imgPaths[imgPaths.length - 1]
        } else {
          img.src = imgPaths[imgIndex - 1]
        }
      }
    } else {
      img.src = imgPaths[0]
    }
  },
  getImages: async (currentUser) => {
    let coparentMemories = []

    // Get memories from coparent
    await DB.getTable(DB.tables.users).then(async (users) => {
      users.forEach(async (user, index) => {
        if (user.memories !== undefined) {
          // Array of memories
          if (currentUser.coparents.map((x) => x.phone).includes(user.phone)) {
            const coparentWithMemories = user
            if (Array.isArray(coparentWithMemories.memories)) {
              coparentWithMemories.memories = Object.assign({}, coparentWithMemories.memories)[0]
            }
            for (let prop in coparentWithMemories.memories) {
              if (prop === 'shareWith') {
                let shareWithArray = coparentWithMemories.memories[prop]
                if (shareWithArray.includes(currentUser.phone)) {
                  coparentMemories = coparentWithMemories.memories['images']
                }
              }
            }
          }
        }
      })
    })

    // console.log(coparentMemories);

    // Get memories from currentUser (Firebase Storage)
    const currentUserMemories = []
    // console.log(currentUser.id);
    await FirebaseStorage.getImages(FirebaseStorage.directories.memories, currentUser.id).then(async (imgPromises) => {
      //   console.log(imgPromises);
      await Promise.all(imgPromises).then(async (images) => {
        if (images.length > 0) {
          currentUserMemories.push(images)
        }
      })
    })

    let uniqueMemories = [...coparentMemories, ...currentUserMemories].flat()

    // console.log(coparentMemories);
    const test = {
      currentUserMemoriesFromFirebase: currentUserMemories,
      uniqueMemories: uniqueMemories,
      coparentMemories: coparentMemories,
    }
    return {
      currentUserMemoriesFromFirebase: currentUserMemories,
      uniqueMemories: uniqueMemories,
      coparentMemories: coparentMemories,
    }
  },
  deleteImage: async (currentUser, theme, imgPaths, directory, path) => {
    // Delete from currentUser.memories
    const imageName = FirebaseStorage.getImageNameFromUrl(path)
    const memoryImageToDelete = imgPaths.filter((x) => {
      if (x.includes(imageName)) {
        return x
      }
    })[0]

    let newArray = imgPaths
    const memoryImageToDeleteIndex = newArray.indexOf(memoryImageToDelete)
    newArray.splice(memoryImageToDeleteIndex, 1)

    const newMemoryObj = {
      shareWith: currentUser.memories.shareWith,
      images: newArray,
    }

    DB.updateRecord(DB.tables.users, currentUser, theme, 'memories', newMemoryObj)
    // Delete from Firebase Storage
    FirebaseStorage.delete(directory, currentUser.id, imageName)
  },
}
export default ImageManager
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation)

  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
