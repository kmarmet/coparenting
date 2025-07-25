import Manager from "../managers/manager"
import UpdateManager from "../managers/updateManager"
import LogManager from "../managers/logManager"
import moment from "moment"

Apis =
  Utils:
     SafeFetchJson:  (url, options = {}) ->
       response = await fetch(url, options)
  
       clone = response.clone()
       
       text = await clone.text()
       
       if !text.trim()
        return null
        
       return JSON.parse(text)

  Sapler:
    GetToneOrSentiment: (toneOrSentiment, message) ->
      Apis.Utils.SafeFetchJson(
          "https://api.sapling.ai/api/v1/#{toneOrSentiment}",
          {
            method: 'POST',
            headers:
              'Content-Type': 'application/json'
            body: JSON.stringify(
              key: process.env.REACT_APP_SAPLER_TONE_API_KEY
              text: message
            )
          }
      ).catch (error) -> reject error

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
        try
          myHeaders = new Headers()
          myHeaders.append "content-type", "application/json"
          myHeaders.append "x-api-key", process.env.REACT_APP_MANY_APIS_API_KEY
          raw = JSON.stringify
            expiry: "10m"
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

        catch error
          LogManager.Log("Error: #{error} | Code File: Apis | Function: ManyApis.GetShortUrl", LogManager.LogTypes.error, error.stack, error)
          
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

  Dates:
    GetHolidays: () ->
      return await new Promise (resolve, reject) ->
        try
          response = await fetch "https://date.nager.at/api/v3/PublicHolidays/#{moment().year()}/US"
          result = await response.json()
          resolve result
        catch error
          LogManager.Log("Error: #{error} | Code File: Apis | Function: Dates.GetHolidays")

export default Apis