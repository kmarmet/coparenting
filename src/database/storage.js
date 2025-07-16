import {deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytes} from 'firebase/storage'
import Manager from '../managers/manager'

const Storage = {
    directories: {
        expenseImages: 'expense-images',
        memories: 'memories',
        documents: 'documents',
        profilePics: 'profilePics',
        appImages: 'appImages',
        brandLogos: 'brandLogos',
        landing: 'landing',
        onboarding: 'onboarding',
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
        return new File([u8arr], imageName, {type: mime})
    },
    getSingleFile: (fileDirectory, id, fileName) =>
        new Promise((resolve, reject) => {
            const storage = getStorage()
            const fileRef = ref(storage, `${fileDirectory}/${id}/${fileName}`)
            getDownloadURL(fileRef)
                .then((url) => {
                    fetch(url)
                        .then((response) => response.text())
                        .then((text) => {
                            resolve(text)
                        })
                        .catch((error) => {
                            reject(error)
                            console.error('Error fetching text file:', error)
                        })
                })
                .catch((error) => {
                    console.error('Error getting download URL:', error)
                })
        }),

    GetSingleFileUrl: async (path) =>
        new Promise(async (resolve, reject) => {
            const storage = getStorage()
            await getDownloadURL(ref(storage, path))
                .then((url) => {
                    if (Manager.IsValid(url)) {
                        resolve(url)
                    }
                })
                .catch((error) => {
                    if (error.toString().includes('storage/object-not-found')) {
                        console.log('image not found')
                    }
                    //
                })
        }),

    GetImageAndUrl: async (imageDir, id, imageName) => {
        const storage = getStorage()
        let imgLoadStatus = 'success'
        let imageUrl = ''
        try {
            await getDownloadURL(ref(storage, `${imageDir}/${id}/${imageName}`))
                .then((url) => {
                    let image = new Image()
                    image.src = url
                    imageUrl = url
                    image.onerror = function (error) {
                        imgLoadStatus = error
                    }
                })
                .catch((error) => {
                    if (error.toString().includes('storage/object-not-found')) {
                        imgLoadStatus = `Firebase Storage item not-found | Item Name: ${imageName} | Directory: ${imageDir} | Id: ${id}`
                    }
                })
        } catch (error) {
            imgLoadStatus = error
            console.log(`Error: ${error} | File: FB Storage: GetImageAndUrl function`)
        }

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
    GetImages: async (imageDir, id) => {
        const storage = getStorage()
        let returnImages = []
        await listAll(ref(storage, `${imageDir}/${id}`)).then(async (res) => {
            returnImages = res.items.map(async (x) => await getDownloadURL(x))
        })

        return returnImages
    },
    GetAppImages: async (imageDir) => {
        const storage = getStorage()
        let returnImages = []
        await listAll(ref(storage, `appImages/${imageDir}`)).then(async (res) => {
            returnImages = res.items.map(async (x) => await getDownloadURL(x))
        })
        const images = await Promise.all(returnImages)
        return images
    },
    imageToBlob: async (img) => {
        const fr = new FileReader()
        const blob = new Blob([img], {type: 'text/plain'})

        return new Promise((resolve, _) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(blob)
        })
    },
    getUrlsFromFiles: async (directory, userId, imgs) => {
        let urls = []
        const imgFiles = Array.from(imgs)
        await Storage.GetImages(directory, userId).then(async (images) => {
            await Promise.all(images).then((firebaseUrls) => {
                firebaseUrls.forEach(async (url) => {
                    const imageName = Storage.GetImageNameFromUrl(url)
                    const fileImageNames = imgFiles.map((x) => x.name)
                    if (fileImageNames.includes(Manager.DecodeHash(imageName))) {
                        urls.push(url)
                    }
                })
            })
        })
        return urls.flat()
    },
    GetFileUrl: async (directory, userKey, fileName) => {
        const url = async () =>
            await new Promise(async (resolve) => {
                await Storage.GetImages(directory, userKey).then(async (images) => {
                    await Promise.all(images).then((firebaseUrls) => {
                        for (let url of firebaseUrls) {
                            const _fileName = Storage.GetImageNameFromUrl(url)
                            console.log(_fileName, fileName)
                            if (_fileName === fileName) {
                                resolve(url)
                            }
                        }
                    })
                })
            })
        return await url()
    },
    getProfilePicUrl: async (directory, userId, imgs) => {
        const images = async () =>
            await new Promise(async (resolve) => {
                await Storage.GetImages(directory, userId).then(async (images) => {
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
                    resolve({successful: image})
                })
                .catch((error) => {
                    if (error.code === 'storage/object-not-found') {
                        resolve({failed: image})
                    } else {
                        resolve({failed: image})
                    }
                })
        }),
    upload: async (fileDirectory, id, file, fileName) => {
        const storage = getStorage()
        const storageRef = ref(storage, `${fileDirectory}/${id}/${fileName}/`)
        await uploadBytes(storageRef, file)
        return await getDownloadURL(ref(storage, `${fileDirectory}/${id}/${fileName}/`))
    },
    UploadByPath: async (path, file, fileName) => {
        try {
            const storage = getStorage()
            const storageRef = ref(storage, `${path}/${fileName}/`)
            console.log(file)
            await uploadBytes(storageRef, file)
            return await getDownloadURL(ref(storage, `${path}/${fileName}/`))
        } catch (error) {
            console.log(error)
            return null
        }
    },
    addProfilePic: (imgDirectory, storageKey, img) =>
        new Promise(async (resolve) => {
            const storage = getStorage()
            const storageRef = ref(storage, `${imgDirectory}/${storageKey}/profilePic`.replace('//', '/'))
            uploadBytes(storageRef, img).then((result) => {
                resolve(result)
            })
        }),
    uploadMultiple: async (imgDirectory, id, images) => {
        const storage = getStorage()
        for (let i = 0; i < images.length; i++) {
            const storageRef = ref(storage, `${imgDirectory}/${id}/${Manager.GenerateHash(images[i].name)}`.replace('//', '/'))
            await uploadBytes(storageRef, images[i])
        }
    },
    deleteFile: async (path) => {
        const storage = getStorage()
        let bin = ref(storage, `${path}`)
        // Delete the file
        deleteObject(bin)
            .then(() => {
                console.log('file deleted')
                // File deleted successfully
            })
            .catch((error) => {
                console.log(error)
                // Uh-oh, an error occurred!
            })
    },
    delete: async (imgDirectory, uid, imageName, recordToDeleteIfNoImage) => {
        const storage = getStorage()
        let bin = ref(storage, `${imgDirectory}/${uid}`)
        if (imageName) {
            bin = ref(storage, `${imgDirectory}/${uid}/${imageName}`)
        }
        // Delete the file
        deleteObject(bin)
            .then(() => {
                console.log('file deleted')
                // File deleted successfully
            })
            .catch((error) => {
                console.log(error)
                //TODO delete from FB Realtime if image does not exist
                // Uh-oh, an error occurred!
            })
    },
    deleteDirectory: async (directoryName, currentUserKey) => {
        const storage = getStorage()
        // Create a reference to the folder you want to Delete
        const folderRef = ref(storage, `${directoryName}/${currentUserKey}`)

        // List all the files in the folder
        listAll(folderRef)
            .then((res) => {
                // Delete each file
                res.items.forEach((itemRef) => {
                    deleteObject(itemRef)
                        .then(() => {
                            console.log('File deleted successfully')
                        })
                        .catch((error) => {
                            console.error('Error deleting file:', error)
                        })
                })
            })
            .catch((error) => {
                console.error('Error listing files:', error)
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
            // console.Log("here: ", `${dir}/${uid}/${imageName}`);
            return new Promise(async (resolve, reject) => {
                await getDownloadURL(ref(storage, `${dir}/${uid}/${imageName}`))
                    .then((url) => {
                        exists = true
                        resolve(true)
                    })
                    .catch(() => {
                        // console.Log("FALSE");
                        reject(false)
                    })
            })
        } catch (error) {
            exists = false
            console.log('erropr here')
        }

        return exists
    },
    GetImageNameFromUrl: (name) => {
        if (!Manager.IsValid(name, true)) {
            return false
        }
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

export default Storage