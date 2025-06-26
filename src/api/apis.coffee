import Manager from "../managers/manager"
import UpdateManager from "../managers/updateManager"
import LogManager from "../managers/logManager"

Apis =
  Sapler:
    GetToneOrSentiment: (toneOrSentiment, message) ->
      new Promise (resolve, reject) ->
        fetch "https://api.sapling.ai/api/v1/#{toneOrSentiment}",
          method: 'POST'
          mode: 'no-cors'
          headers:
            'Content-Type': 'application/json'
          body: JSON.stringify
            key: '7E3IFZEMEKYEHVIMJHENF9ETHHTKARA4'
            text: message
        .then (response) ->
          if Manager.IsValid(response)
            return response
          else
            reject "Unable to parse Apis response"
        .then (result) -> resolve result.json()
        .catch (error) -> reject error

  IPify:
    GetIPAddress: () ->
      new Promise (resolve, reject) ->
        requestOptions =
          method: "GET"
          redirect: "follow"

        response = await fetch "https://api.ipify.org", requestOptions
        result = await response.text()
        if Manager.IsValid(result)
          resolve result
        else
          reject "Unable to parse IPify response"

  ManyApis:
    GetShortUrl: (url) ->
      new Promise (resolve, reject) ->
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

        response = await fetch "https://api.manyapis.com/v1-create-short-url", requestOptions
        result = await response.json()

        if Manager.IsValid(result)
          resolve result
        else
          reject "Unable to parse ManyApis response"

    GetTimezone: (ipAddress) ->
      new Promise (resolve, reject) ->
        myHeaders = new Headers()
        myHeaders.append "x-api-key", process.env.REACT_APP_MANY_APIS_API_KEY

        requestOptions =
          method: "GET"
          headers: myHeaders
          redirect: "follow"

        response = await fetch "https://api.manyapis.com/v1-get-ip-detail?ip=#{ipAddress}", requestOptions
        result = await response.json()

        if Manager.IsValid(result)
          resolve result
        else
          reject "Unable to parse ManyApis response"

    GetLocationDetails: (ipAddress) ->
      new Promise (resolve, reject) ->
        myHeaders = new Headers()
        myHeaders.append "x-api-key", process.env.REACT_APP_MANY_APIS_API_KEY

        requestOptions =
          method: "GET"
          headers: myHeaders
          redirect: "follow"

        response = await fetch "https://api.manyapis.com/v1-get-ip-detail?ip=#{ipAddress}", requestOptions
        result = await response.json()

        if Manager.IsValid(result)
          resolve result
        else
          reject "Unable to parse ManyApis response"

  OCR:
    GetHTMLFromImage: (extension, shortenedUrl) ->
      new Promise (resolve, reject) ->
        response = await fetch "https://api.ocr.space/parse/imageurl?apikey=#{process.env.REACT_APP_OCR_API_KEY}&url=#{shortenedUrl}&OCREngine=2&filetype=#{extension}"
        result = await response.text()

        if Manager.IsValid(result)
          resolve result
        else
          reject "Unable to parse OCR response"

  OneSignal:
    SendUpdate: (subId, raw) ->
      new Promise (resolve, reject) ->
        myHeaders = new Headers()
        myHeaders.append "Accept", "application/json"
        myHeaders.append "Content-Type", "application/json"
        myHeaders.append "Authorization", "Basic #{UpdateManager.apiKey}"

        requestOptions =
          method: "POST"
          headers: myHeaders
          body: raw
          redirect: "follow"

        # Do not send notification in dev
        if !window.location.href.includes("localhost")
          fetch "https://api.onesignal.com/notifications", requestOptions
          .then (response) -> response.text()
          .then (result) ->
            console.log("Sent to #{subId}")
          .catch (error) ->
            LogManager.Log("Error: #{error} | Code File: Apis | Function: OneSignal.SendUpdate")

export default Apis