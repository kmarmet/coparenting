import SecurityManager from "./securityManager"
import imageCompression from 'browser-image-compression'
import _ from "lodash"
import DB from "../database/DB"
import { saveAs } from 'file-saver'
import FirebaseStorage from '../database/firebaseStorage'
import domtoimage from 'dom-to-image'
import AlertManager from "./alertManager";

ImageManager =
  shortenUrl: (url) ->
    shortenedUrlObject = ''
    myHeaders = new Headers()
    myHeaders.append "content-type", "application/json"
    myHeaders.append "x-api-key", process.env.REACT_APP_MANY_APIS_API_KEY

    raw = JSON.stringify
      expiry: "5m"
      url: url

    requestOptions =
      method: "POST"
      headers: myHeaders
      body: raw
      redirect: "follow"

    try
      response = await fetch("https://api.manyapis.com/v1-create-short-url", requestOptions)

      result = await response.json()
      shortenedUrlObject = result;
    catch error
      console.error error
      AlertManager.throwError('Unable to parse image. Please try again after a few minutes.')
      return false;

    return shortenedUrlObject.shortUrl

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
      .uppercaseFirstLetterOfAllWords()

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
    await FirebaseStorage.getImages(FirebaseStorage.directories.memories, currentUser.key).then (imgPromises) ->
      await Promise.all(imgPromises).then (images) ->
        if images.length > 0
          allMemories.push(images)

    returnMemories = allMemories
    returnMemories

  deleteImage: (currentUser, imgPaths, directory, path) ->
    imageName = FirebaseStorage.GetImageNameFromUrl(path)
    memoryImageToDelete = imgPaths.filter((x) -> x.includes(imageName))[0]

    newArray = imgPaths
    memoryImageToDeleteIndex = newArray.indexOf(memoryImageToDelete)
    newArray.splice(memoryImageToDeleteIndex, 1)

    newMemoryObj =
      shareWith: currentUser.memories.shareWith
      images: newArray

    DB.updateRecord(DB.tables.users, currentUser, 'memories', newMemoryObj)
    FirebaseStorage.delete(directory, currentUser.key, imageName)

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

  rotateSize: (width, height, rotation) ->
    rotRad = getRadianAngle(rotation)
    {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }

export default ImageManager