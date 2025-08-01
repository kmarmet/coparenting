// Generated by CoffeeScript 2.7.0
var ArchiveManager

import StringManager from './stringManager'

export default ArchiveManager = {
    createCSV: function (data, filename, exportType) {
        var blob, csvRows, formattedHeaders, header, headers, i, j, k, key, l, len, len1, len2, len3, link, obj, ref, ref1, ref2, values
        // Convert data to CSV format
        csvRows = []
        formattedHeaders = []
        headers = Object.keys(data[0])
        console.log(headers)
        for (i = 0, len = data.length; i < len; i++) {
            obj = data[i]
            for (j = 0, len1 = obj.length; j < len1; j++) {
                key = obj[j]
                obj[key] = StringManager.SpaceBetweenWords(key)
                obj[key] = StringManager.UppercaseFirstLetterOfAllWords(key)
            }
        }
        // Remove headers the user does not need to see
        headers = headers.filter(function (header) {
            return (
                header !== 'id' &&
                header !== 'isRecurring' &&
                header !== 'shareWith' &&
                header !== 'imageName' &&
                header !== 'ownerKey' &&
                header !== 'notificationSent' &&
                header !== 'senderKey' &&
                header !== 'recipientKey'
            )
        })
        for (k = 0, len2 = headers.length; k < len2; k++) {
            header = headers[k]
            header = StringManager.SpaceBetweenWords(header)
            header = StringManager.UppercaseFirstLetterOfAllWords(header)
            formattedHeaders.push(header)
        }
        // Add headers
        csvRows.push(formattedHeaders.join(','))
        for (l = 0, len3 = data.length; l < len3; l++) {
            obj = data[l]
            if (exportType === 'expenses') {
                if (obj != null) {
                    obj.payer = obj != null ? ((ref = obj.payer) != null ? ref.name : void 0) : void 0
                }
            }
            if (exportType === 'chat') {
                if (obj != null) {
                    obj.recipient = obj != null ? ((ref1 = obj.recipient) != null ? ref1.name : void 0) : void 0
                }
                if (obj != null) {
                    obj.sender = obj != null ? ((ref2 = obj.sender) != null ? ref2.name : void 0) : void 0
                }
            }
            values = headers.map(function (header) {
                return obj[header]
            })
            csvRows.push(values.join(','))
        }
        // Create a Blob object
        blob = new Blob([csvRows.join('\n')], {
            type: 'text/csv',
        })
        // Create a link element and trigger a click event to download the file
        link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        return document.body.removeChild(link)
    },
}

//# sourceMappingURL=vaultManager.js.map