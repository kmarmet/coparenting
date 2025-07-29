import React from "react"
import AppImages from "../../constants/appImages"

const InlineLoadingSpinner = () => {
    return (
        <div id={"inline-loading-spinner-wrapper"}>
            <img src={AppImages.misc.inlineLoadingSvg.url} alt="Loading..." />
        </div>
    )
}

export default InlineLoadingSpinner