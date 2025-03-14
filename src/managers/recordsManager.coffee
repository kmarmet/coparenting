import Manager from "./manager"

export default RecordsManager = {
  createCSV: (data, filename, exportType) ->
    # Convert data to CSV format
    csvRows = []
    headers = Object.keys(data[0])
    csvRows.push(headers.join(','))

    for row in data
      if exportType == "expenses"
        row.payer = row.payer.name
        row?.shareWith = null;
      if exportType == "chat"
        row.readState = null
      row.id = null

      values = headers.map (header) -> row[header]
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