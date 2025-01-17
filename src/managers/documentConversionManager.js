import Manager from '../managers/manager'
import { createWorker } from 'tesseract.js'
import FirebaseStorage from '../database/firebaseStorage'
import reactStringReplace from 'react-string-replace'
import StringManager from './stringManager'
// 'thanksgiving day',
// 'thanksgiving weekend',
// 'christmas day',
// "new year's day",
// "new year's eve",
// 'christmas break',
// 'between',
//   'background',
// 'thanksgiving-day',
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
    console.log(returnHtml)
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
  hasNumbers: (str) => {
    var regex = /\d/g
    return regex.test(str)
  },
  cleanHeader: (header, uppercaseAll = false, uppercaseFirstWord) => {
    let returnString = header.replaceAll('-', ' ')
    if (uppercaseAll) {
      returnString = returnString.toUpperCase()
    }
    if (uppercaseFirstWord) {
      returnString = StringManager.uppercaseFirstLetterOfAllWords(returnString)
    }
    return returnString.replaceAll("'", '')
  },
  formatDocHeaders: (text) => {
    DocumentConversionManager.tocHeaders.forEach((header) => {
      text = text.replaceAll(
        DocumentConversionManager.cleanHeader(header, true),
        `<span data-header-name="${header.replaceAll("'", '&apos;')}" class="header">${DocumentConversionManager.cleanHeader(header)}</span>`
      )
    })
    return text
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
    myHeaders.append('Authorization', 'Bearer 4a44586a48f7fdaa4fae19b700019017273112de')

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
  imageToTextAndAppend: async (imagePath, textContainer) => {
    let returnText = ''
    const worker = await createWorker()
    await worker.recognize(imagePath).then((result) => {
      let confidence = result.confidence
      console.log(confidence)
      const { data } = result
      const { symbols, lines, paragraphs } = data
      let allText = []
      for (let par of paragraphs) {
        allText.push(par.text)
      }
      returnText = allText
      //let textWithHeaders = DocumentConversionManager.wrapTextInHeader(allText[0])
      // returnText = reactStringReplace(result, allText[0].toLocaleLowerCase(), (match, i) => (
      //   <span className="header" key={match + i}>
      //     {match}
      //   </span>
      // ))
      for (let line of lines) {
        // returnText = reactStringReplace(result, line.text.toLocaleLowerCase(), (match, i) => (
        //   <span className="header" key={match + i}>
        //     {match}
        //   </span>
        // ))
        // if (line.text.indexOf('Halloween') > -1) {
        //   const wordPosition = getPositionOfWordInText('Halloween', line.text)
        //   const { start, end } = wordPosition
        //   console.log(start, end)
        //   if (start > -1 && start > 0) {
        //     console.log(start, end)
        //     // console.log(line.text.substring(start, end))
        //   }
        //   line.text = `<span className="sub-header">${line.text}</span>`
        // }
      }

      //returnText = allText[0]

      // const parEl = document.createElement('p')
      // // par.text = DocumentConversionManager.formatDocHeaders(par.text)
      //
      // parEl.innerHTML = allText[0]
      // textContainer.appendChild(parEl)

      // paragraphs.forEach((par) => {
      //   if (DocumentConversionManager.hasNumbers(par.text) && par.text.trim().split(/\s+/).length <= 10) {
      //     par.text = `<span className="sub-header">${par.text}</span>`
      //   }
      //
      //   const parEl = document.createElement('p')
      //   par.text = DocumentConversionManager.formatDocHeaders(par.text)
      //
      //   parEl.innerHTML = par.text
      //   textContainer.appendChild(parEl)
      // })
    })
    await worker.terminate()
    return returnText
  },
  addHeaderClass: (el) => {
    let strong = el.querySelector('strong')

    if (el.tagName.toLowerCase() === 'strong') {
      if (Manager.isValid(el)) {
        const strongText = el.textContent
        const hasNumbers = strongText.indexOf('.') > -1
        if (hasNumbers && StringManager.wordCount(strongText) < 6 && strongText.length > 3) {
          el.parentNode.classList.add('header')
        }
        if (StringManager.wordCount(strongText) <= 6 && strongText.length > 5) {
          if (strongText.toLowerCase().indexOf('state') === -1 && strongText.toLowerCase().indexOf('county') === -1) {
            el.parentNode.classList.add('header')
          } else {
            el.parentNode.classList.remove('header')
          }
        }
      }
    } else {
      if (Manager.isValid(strong)) {
        const strongText = strong.textContent
        const hasNumbers = strongText.indexOf('.') > -1

        if (hasNumbers && StringManager.wordCount(strongText) < 6 && strongText.length > 3) {
          el.classList.add('header')
        }
        if (StringManager.wordCount(strongText) <= 6 && strongText.length > 5) {
          if (strongText.toLowerCase().indexOf('state') === -1 && strongText.toLowerCase().indexOf('county') === -1) {
            el.classList.add('header')
          }
        }
      }
    }
  },
}

export default DocumentConversionManager