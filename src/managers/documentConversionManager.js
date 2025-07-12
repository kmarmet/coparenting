import Apis from '../api/apis'
import Storage from '../database/storage'
import AlertManager from './alertManager'
import LogManager from './logManager'
import StringManager from './stringManager'

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

    DocToHtml: async (fileName, currentUserKey) => {
        try {
            const myHeaders = new Headers()
            let returnHtml = ''
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

            await fetch(`${apiAddress}/document/getDocText?fileName=${fileName}&currentUserId=${currentUserKey}`, requestOptions)
                .then((response) => response.text())
                .then((result) => (returnHtml = result))
                .catch((error) => console.error(error))

            return returnHtml
        } catch (error) {
            LogManager.Log(`Error: ${error} | Code File: documentConversionManager | Function: DocToHtml | User: ${currentUserKey}`)
            console.log(`Error: ${error} | File: ; ${fileName} | User: ${currentUserKey}`)
        }
        return ''
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
        const all = await Storage.GetImageAndUrl(Storage.directories.documents, currentUserId, fileName)
        const {status, imageUrl} = all
        if (status === 'success') {
            await fetch(`${apiAddress}/document/getTextFromPdf?fileName=${fileName}&currentUserId=${currentUserId}`, requestOptions)
                .then((response) => response.text())
                .then((result) => (returnHtml = result))
                .catch((error) => console.error(error))
        }
        return returnHtml
    },
    imageToHtml: async (url, fileName) => {
        let returnHtml = ''
        const extension = StringManager.GetFileExtension(fileName)
        const myHeaders = new Headers()
        myHeaders.append('Content-Type', 'image/*')
        let shortenedUrl = await Apis.ManyApis.GetShortUrl(url)

        const requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow',
        }

        try {
            returnHtml = await Apis.OCR.GetHTMLFromImage(extension, shortenedUrl)
        } catch (error) {
            AlertManager.throwError('Unable to parse image. Please try again after a few minutes.')
            console.error(error)
        }

        return returnHtml
    },
}

export default DocumentConversionManager