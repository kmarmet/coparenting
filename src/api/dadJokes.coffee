DadJokes =
  getJoke: ->
    new Promise (resolve, reject) ->
      console.log false
      fetch 'https://api.api-ninjas.com/v1/dadjokes',
        method: 'GET'
        headers: 'X-Api-Key': process.env.REACT_APP_DAD_JOKES_API_KEY
        contentType: 'application/json'
        .then (jokeResponse) ->
        jokeResponse.json().then (joke) ->
          resolve joke[0].joke

export default DadJokes