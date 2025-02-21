import Manager from '../managers/manager'
import { createWorker } from 'tesseract.js'
import FirebaseStorage from '../database/firebaseStorage'
import reactStringReplace from 'react-string-replace'
const DocumentConversionManager = {
  tocHeaders: [
    'income tax exemptions',
    'child support',
    'spousal maintenance',
    'matrimonial home',
    'assets',
    'debts',
    'equitable distribution release',
    'dower courtesy and homestead release',
    'living separate and apart',
    'interference',
    'child custody',
    'estate and testamentary disposition',
    'pension release',
    'general release',
    'general provisions',
    'acknowledgement',
    'division of property',
    'real estate',
    'household goods and furnishings',
    'motor vehicles',
    'financial accounts',
    'incomes taxes',
    'definitions',
    'the distribution',
    'mutual releases indemnification and litigation',
    'custody and visitation',
    'spousal support',
    'the family residence',
    'retirement benefits',
    'husbands separate property',
    'wifes separate property',
    'severability and enforceability',
    'law applicable',
    'introductory provisions',
    'property',
    'purpose of agreement',
    'the parties',
    'the marriage',
    'separation date',
    'armed forces',
    'name change',
    'minor children',
    'financial disclosure',
    'health insurance',
    'marital home',
    'husbands"s property',
    'wife"s liabilities debts',
    'payment to balance division',
    'ground for legal separation',
    'assets disclosure',
    'other property provisions',
    'liabilities disclosure',
    'undisclosed gifts',
    'future liabilities',
    'release of liabilities and claims',
    'status of temporary orders',
    'waiver of rights on death of other spouse',
    'reconciliation',
    'modification by subsequent agreement',
    'attorney fees to enforce or modify agreement',
    'cooperation in implementation',
    'effective date',
    'court action',
    'severability',
    'additional terms & conditions',
    'future children',
    'parenting visitation',
    'physical custody',
    'notice of change of residence',
    'previous court actions',
    'additional support',
    'deferred',
    'dependents',
  ],
  docToHtml: async (fileName, currentUserId) => {
    const myHeaders = new Headers()
    myHeaders.append('Access-Control-Allow-Origin', '*')
    // let apiAddress = 'https://localhost:5000'
    let apiAddress = 'https://peaceful-coparenting.app:5000'
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      mode: 'cors',
      crossOrigin: true,
      redirect: 'follow',
    }

    let returnHtml = ''
    const all = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, currentUserId, fileName)
    const { status, imageUrl } = all
    if (status === 'success') {
      await fetch(`${apiAddress}/document/getDocText?fileName=${fileName}&currentUserId=${currentUserId}`, requestOptions)
        .then((response) => response.text())
        .then((result) => (returnHtml = result))
        .catch((error) => console.error(error))
    }
    return returnHtml
  },
  pdfToHtml: async (fileName, currentUserId) => {
    const myHeaders = new Headers()
    myHeaders.append('Access-Control-Allow-Origin', '*')
    let apiAddress = 'https://localhost:5000'
    // let apiAddress = 'https://peaceful-coparenting.app:5000'
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      mode: 'cors',
      crossOrigin: true,
      redirect: 'follow',
    }

    let returnHtml = ''
    const all = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, currentUserId, fileName)
    const { status, imageUrl } = all
    if (status === 'success') {
      await fetch(`${apiAddress}/document/getTextFromPdf?fileName=${fileName}&currentUserId=${currentUserId}`, requestOptions)
        .then((response) => response.text())
        .then((result) => (returnHtml = result))
        .catch((error) => console.error(error))
    }
    return returnHtml
  },
  imageToHtml: async (fileName, currentUserId) => {
    const myHeaders = new Headers()
    myHeaders.append('Access-Control-Allow-Origin', '*')
    let apiAddress = 'https://localhost:5000'
    // let apiAddress = 'https://peaceful-coparenting.app:5000'
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      mode: 'cors',
      crossOrigin: true,
      redirect: 'follow',
    }

    let returnHtml = ''
    const all = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, currentUserId, fileName)
    const { status, imageUrl } = all
    if (status === 'success') {
      await fetch(`${apiAddress}/document/GetTextFromImage?fileName=${fileName}&currentUserId=${currentUserId}`, requestOptions)
        .then((response) => response.text())
        .then((result) => (returnHtml = result))
        .catch((error) => console.error(error))
    }
    return returnHtml
  },
  wrapTextInHeader: (text) => {
    const asArray = text.split(' ')
    let result = reactStringReplace(text, 'Thanksgiving', (match, i) => (
      <span className="header" key={match + i}>
        {match}
      </span>
    ))

    for (let _string of asArray) {
      if (DocumentConversionManager.tocHeaders.includes(_string.toLowerCase())) {
        result = reactStringReplace(result, _string.toLocaleLowerCase(), (match, i) => (
          <span className="header" key={match + i}>
            {match}
          </span>
        ))
      }
    }

    return result
  },
  getImageText: async (imgUrl) => {
    const worker = await createWorker()
    // Set the whitelist to only recognize digits and letters
    // await worker.setParameters({
    //   preserve_interword_spaces: '0',
    //   tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    // })
    const result = await worker.recognize(imgUrl)
    const { data } = result
    const { text } = data
    await worker.terminate()
    return text
  },
  imageToText: async (imageUrl) => {
    const myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Authorization', `Bearer 4a44586a48f7fdaa4fae19b700019017273112de`)

    const raw = JSON.stringify({
      image_url: imageUrl,
    })

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    }

    try {
      let returnResult = ''
      const response = await fetch('https://www.imagetotext.info/api/imageToText', requestOptions).catch((error) => {
        returnResult = null
      })
      if (response) {
        let result = await response.text()
        returnResult = JSON.parse(result).result
      }
      // console.log(JSON.parse(result).result)
      if (Manager.isValid(returnResult, true)) {
        return returnResult
      } else {
        return null
      }
    } catch (error) {
      return error
    }
  },
}

export default DocumentConversionManager