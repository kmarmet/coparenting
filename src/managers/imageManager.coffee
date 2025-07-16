import SecurityManager from "./securityManager"
import imageCompression from 'browser-image-compression'
import _ from "lodash"
import DB from "../database/DB"
import {saveAs} from 'file-saver'
import Storage from '../database/storage'
import domtoimage from 'dom-to-image'
import AlertManager from "./alertManager"
import Apis from "../api/apis";

ImageManager =
  ImageIsValid: (url) ->
    promise = new Promise (resolve) ->
      img = new Image()
      img.onload = -> resolve(true)   # valid image
      img.onerror = -> resolve(false) # broken image
      img.src = url
    return await promise

  shortenUrl: (url) ->
    shortenedUrlObject =
      shortUrl: ''
    try
      shortenedUrlObject = await Apis.ManyApis.GetShortUrl(url);
    catch error
      console.error error
      AlertManager.throwError('Unable to parse image. Please try again after a few minutes.')
      return false;

    return shortenedUrlObject?.shortUrl

  getStatusCode: (url) ->
    new Promise((resolve, reject) ->
      fetch  url
        .then (response) ->
          resolve(response.status)
        .catch (error) ->
          reject(error)
    )

  compressImage: (imgFile) ->
    try
      options = {
        maxSizeMB: 1,
        useWebWorker: true,
      }
      compressedFile = await imageCompression(imgFile, options);
      console.log('compressedFile instanceof Blob', compressedFile instanceof Blob);
      console.log("compressedFile size #{compressedFile.size / 1024 / 1024} MB");
      return compressedFile
    catch error
      console.log(error)

  expandImage: (img, form) ->
    form ?= document.querySelector('.image - form')
    src = img.getAttribute('src')
    imageModal = form
    imageModal.querySelector('img').setAttribute('src', src)
    imageModal.classList.add('active')

  formatImageName: (imageName) ->
    imageName
      .replace(/\.[^/.]+$/, '')
      .replaceAll(' - ', ' ')
      .replaceAll('_', ' ')
      .UppercaseFirstLetterOfAllWords()

  blobToImage: (blob) ->
    new Promise (resolve) ->
      url = URL.createObjectURL(blob)
      img = new Image()
      img.onload = ->
        URL.revokeObjectURL(url)
        resolve(img)
      img.src = url
      console.log(img)

  navigateToImage: (direction, imgPaths) ->
    img = document.querySelector(' #form-img')
    src = img.getAttribute('src')
    imgIndex = imgPaths.indexOf(src)
    if imgIndex > -1 and imgIndex + 1 < imgPaths.length
      if direction is 'forward'
        img.src = imgPaths[imgIndex + 1]
      else
        if imgPaths[imgIndex - 1] is undefined
          img.src = imgPaths[imgPaths.length - 1]
        else
          img.src = imgPaths[imgIndex - 1]
    else
      img.src = imgPaths[0]

  getImages: (currentUser) ->
    allMemories = []
    memories = await SecurityManager.getMemories(currentUser)
    allMemories = memories
    await Storage.GetImages(Storage.directories.memories, currentUser.key).then (imgPromises) ->
      await Promise.all(imgPromises).then (images) ->
        if images.length > 0
          allMemories.push(images)

    returnMemories = allMemories
    returnMemories

  deleteImage: (currentUser, imgPaths, directory, path) ->
    imageName = Storage.GetImageNameFromUrl(path)
    memoryImageToDelete = imgPaths.filter((x) -> x.includes(imageName))[0]

    newArray = imgPaths
    memoryImageToDeleteIndex = newArray.indexOf(memoryImageToDelete)
    newArray.splice(memoryImageToDeleteIndex, 1)

    newMemoryObj =
      shareWith: currentUser.memories.shareWith
      images: newArray

    DB.updateRecord(DB.tables.users, currentUser, 'memories', newMemoryObj)
    Storage.delete(directory, currentUser.key, imageName)

  createImage: (url) ->
    image = new Image()
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
    image

  getRadianAngle: (degreeValue) ->
    (degreeValue * Math.PI) / 180

  saveImageFromUrl: (imageSelector, url, fileName) ->
    setTimeout ->
      if !_.isEmpty(imageSelector)
        image = document.querySelector(imageSelector)
        domtoimage.toBlob(image).then (blob) ->
          saveAs(blob, fileName)
      if !_.isEmpty(url)
        saveAs(url, fileName)
    , 300

export default ImageManager