// Generated by CoffeeScript 2.7.0
var RecordsManager;

export default RecordsManager = {
  createCSV: function(data, filename) {
    var blob, csvRows, headers, i, len, link, results, row, values;
    // Convert data to CSV format
    csvRows = [];
    headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    results = [];
    for (i = 0, len = data.length; i < len; i++) {
      row = data[i];
      row.payer = row.payer.name;
      row.id = null;
      row.shareWith = null;
      values = headers.map(function(header) {
        return row[header];
      });
      csvRows.push(values.join(','));
      // Create a Blob object
      blob = new Blob([csvRows.join('\n')], {
        type: 'text/csv'
      });
      // Create a link element and trigger a click event to download the file
      link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      results.push(document.body.removeChild(link));
    }
    return results;
  }
};
