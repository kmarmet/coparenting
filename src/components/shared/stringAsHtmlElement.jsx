import React from 'react'

export default function StringAsHtmlElement({text, classes = ''}) {
  return <p className={classes} dangerouslySetInnerHTML={{__html: text}}></p>
}