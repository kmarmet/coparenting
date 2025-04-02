import StringManager from "./stringManager"

export default ArchiveManager = {
  createCSV: (data, filename, exportType) ->
    # Convert data to CSV format
    csvRows = []
    formattedHeaders = []
    headers = Object.keys(data[0])

    formattedData  = []
    for obj in data
      for key in obj
        obj[key] = StringManager.spaceBetweenWords(key)
        obj[key] = StringManager.uppercaseFirstLetterOfAllWords(key)

    # Remove headers the user does not need to see
    headers = headers.filter (header) -> header != "id" && header != "shareWith" && header != "imageName" && header != "ownerKey"

    for header in headers
      header = StringManager.spaceBetweenWords(header)
      header = StringManager.uppercaseFirstLetterOfAllWords(header)
      formattedHeaders.push(header)

    # Add headers
    csvRows.push(formattedHeaders.join(','))


    for obj in data
      if exportType == "expenses"
        obj?.payer = obj?.payer?.name

      values = headers.map (header) -> obj[header]
      csvRows.push(values.join(','))

    # Create a Blob object
    blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })

    # Create a link element and trigger a click event to download the file
    link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}