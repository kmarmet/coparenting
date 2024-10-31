import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytes } from 'firebase/storage'
import Manager from '@manager'
import DB from '@db'

const FirebaseStorage = {
  directories: {
    expenseImages: 'expense-images',
    memories: 'memories',
    documents: 'documents',
    profilePics: 'profilePics',
    chatRecoveryRequests: 'chatRecoveryRequests',
  },
  base64ToImage: (dataUrl, imageName) => {
    var arr = dataUrl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[arr.length - 1]),
      n = bstr.length,
      u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], imageName, { type: mime })
  },
  getSingleImage: async (imageDir, id, imageName, domImg) =>
    new Promise(async (resolve, reject) => {
      const storage = getStorage()
      await getDownloadURL(ref(storage, `${imageDir}/${id}/${imageName}`))
        .then((url) => {
          if (Manager.isValid(url)) {
            if (url.indexOf(id) > -1) {
              resolve(url)
            }
          }
        })
        .catch((error) => {
          if (error.toString().includes('storage/object-not-found')) {
            console.log('image not found')
          }
          //
        })
    }),
  getImageAndUrl: async (imageDir, id, imageName) => {
    const storage = getStorage()
    let imgLoadStatus = 'success'
    let imageUrl = ''
    await getDownloadURL(ref(storage, `${imageDir}/${id}/${imageName}`))
      .then((url) => {
        var image = new Image()
        image.src = url
        imageUrl = url
        image.onerror = function () {
          imgLoadStatus = 'error'
        }
      })
      .catch((error) => {
        if (error.toString().includes('storage/object-not-found')) {
          imgLoadStatus = 'error'
        }
      })

    return {
      status: imgLoadStatus,
      imageUrl,
    }
  },
  getBlob: async (imageDir, id, fileName) => {
    const storage = getStorage()
    return await getDownloadURL(ref(storage, `${imageDir}/${id}/${fileName}`)).then((url) => {
      const xhr = new XMLHttpRequest()
      xhr.responseType = 'blob'
      xhr.onload = (event) => {
        const blob = xhr.response
      }
      xhr.open('GET', url)
      xhr.send()
    })
  },
  getImages: async (imageDir, id) =>
    new Promise(async (resolve) => {
      const storage = getStorage()
      let returnImages = []
      await listAll(ref(storage, `${imageDir}/${id}`)).then(async (res) => {
        returnImages = res.items.map(async (x) => await getDownloadURL(x))
        resolve(returnImages)
      })
    }),
  imageToBlob: async (img) => {
    const fr = new FileReader()
    const blob = new Blob([img], { type: 'text/plain' })

    return new Promise((resolve, _) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  },
  getUrlsFromFiles: async (directory, userId, imgs) => {
    // console.log(directory, userId, domImg);
    let urls = []
    const imgFiles = Array.from(imgs)
    await FirebaseStorage.getImages(directory, userId).then(async (images) => {
      await Promise.all(images).then((firebaseUrls) => {
        firebaseUrls.forEach(async (url) => {
          const imageName = FirebaseStorage.getImageNameFromUrl(url)
          const fileImageNames = imgFiles.map((x) => x.name)
          if (fileImageNames.includes(imageName)) {
            urls.push(url)
          }
        })
      })
    })
    return urls.flat()
  },
  getProfilePicUrl: async (directory, userId, imgs) => {
    const images = async () =>
      await new Promise(async (resolve) => {
        await FirebaseStorage.getImages(directory, userId).then(async (images) => {
          await Promise.all(images).then((firebaseUrls) => {
            firebaseUrls.forEach(async (urls) => {
              resolve(urls)
            })
          })
        })
      })
    const url = await images()
    return url
  },
  imageExists: async (url, image) =>
    new Promise(async (resolve, reject) => {
      const storage = getStorage()
      const storageRef = ref(storage, url)

      await getDownloadURL(storageRef)
        .then((url) => {
          resolve({ successful: image })
        })
        .catch((error) => {
          if (error.code === 'storage/object-not-found') {
            resolve({ failed: image })
          } else {
            resolve({ failed: image })
          }
        })
    }),
  upload: async (imgDirectory, id, img, imgName) => {
    let returnUrl
    const storage = getStorage()
    console.log(img)
    console.log(`${imgDirectory}/${id}/${imgName}/`)
    const storageRef = ref(storage, `${imgDirectory}/${id}/${imgName}/`)
    await uploadBytes(storageRef, img)
    await getDownloadURL(ref(storage, `${imgDirectory}/${id}/${imgName}/`)).then((url) => {
      returnUrl = url
    })

    return returnUrl
  },
  addProfilePic: (imgDirectory, storageKey, img) =>
    new Promise(async (resolve) => {
      const storage = getStorage()
      const storageRef = ref(storage, `${imgDirectory}/${storageKey}/profilePic`.replace('//', '/'))
      uploadBytes(storageRef, img).then((result) => {
        resolve(result)
      })
    }),
  uploadChatRecoverySignature: (storageKey, img) =>
    new Promise(async (resolve) => {
      const storage = getStorage()
      const path = `${DB.tables.chatRecoveryRequests}/${storageKey}/signature.jpg`.replace('//', '/')
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, img).then(async (result) => {
        const url = await FirebaseStorage.getProfilePicUrl(FirebaseStorage.directories.chatRecoveryRequests, storageKey)
        resolve(url)
      })
    }),
  uploadMultiple: async (imgDirectory, id, images) => {
    const storage = getStorage()
    for (let i = 0; i < images.length; i++) {
      const storageRef = ref(storage, `${imgDirectory}/${id}/${images[i].name}`.replace('//', '/'))
      await uploadBytes(storageRef, images[i])
    }
  },
  delete: async (imgDirectory, uid, imageName, recordToDeleteIfNoImage) => {
    // console.log('DELETING')
    // console.log(imageName)
    const storage = getStorage()
    let bin = ref(storage, `${imgDirectory}/${uid}`)
    if (imageName) {
      bin = ref(storage, `${imgDirectory}/${uid}/${imageName}`)
      // console.log(bin)
    }
    // Delete the file
    deleteObject(bin)
      .then(() => {
        console.log('file deleted')
        // File deleted successfully
      })
      .catch((error) => {
        console.log(error)
        if (recordToDeleteIfNoImage) {
          DB.delete(DB.tables.users, recordToDeleteIfNoImage.id)
        }
        // Uh-oh, an error occurred!
      })
  },
  downloadImage: async (imageSrc, imageName = 'Image') => {
    const image = await fetch(imageSrc)
    const imageBlog = await image.blob()
    const imageURL = URL.createObjectURL(imageBlog)

    const link = document.createElement('a')
    link.href = imageURL
    link.download = imageName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },
  doesItemExist: async (imageName, dir, uid) => {
    const storage = getStorage()
    let exists = false
    try {
      // console.log("here: ", `${dir}/${uid}/${imageName}`);
      return new Promise(async (resolve, reject) => {
        await getDownloadURL(ref(storage, `${dir}/${uid}/${imageName}`))
          .then((url) => {
            exists = true
            resolve(true)
          })
          .catch(() => {
            // console.log("FALSE");
            reject(false)
          })
      })
    } catch (error) {
      exists = false
      console.log('erropr here')
    }

    return exists
  },
  getImageNameFromUrl: (name) => {
    const url = decodeURIComponent(name)
    let indexOfMemories = url.indexOf('IMG_')
    let indexOfImageName = url.indexOf('?alt')
    let imageName = url.substring(indexOfMemories, indexOfImageName)

    // For named images
    if (name.indexOf('IMG_') === -1) {
      let indexOfMemories = url.lastIndexOf('/')
      let indexOfAlt = url.indexOf('?alt')
      imageName = url.substring(indexOfMemories + 1, indexOfAlt)
    }
    return imageName
  },
}

export default FirebaseStorage
