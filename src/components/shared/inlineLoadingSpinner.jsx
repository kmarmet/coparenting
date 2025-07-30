import React, {useEffect} from "react"
import AppImages from "../../constants/appImages"

const InlineLoadingSpinner = ({theme = "light", show = false, wrapperClasses = "", imgClasses = ""}) => {
    useEffect(() => {
        const activeForm = document.querySelector(".form-wrapper.active")
        if (activeForm) {
            if (show) {
                activeForm.classList.add("submitting")
            } else {
                activeForm.classList.remove("submitting")
            }
        }
    }, [show])
    return (
        <div id={"inline-loading-spinner-wrapper"} className={`${show ? "active" : "hidden"}${wrapperClasses ? ` ${wrapperClasses}` : ""}`}>
            {theme === "light" ? (
                <img src={AppImages.misc.inlineLoadingSpinner.url} alt="Loading..." className={imgClasses} />
            ) : (
                <img src={AppImages.misc.whiteInlineSpinner.url} alt="Loading..." className={imgClasses} />
            )}
        </div>
    )
}

export default InlineLoadingSpinner