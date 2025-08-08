import React from "react"

export default function StringAsHtmlElement({text, classes = "", elementType = "p"}) {
    return (
        <>
            {elementType === "p" && <p className={classes} dangerouslySetInnerHTML={{__html: text}}></p>}
            {elementType === "span" && <span className={classes} dangerouslySetInnerHTML={{__html: text}}></span>}
        </>
    )
}