import React from "react"
import Manager from "../../managers/manager"
import StringAsHtmlElement from "./stringAsHtmlElement"

const DetailRow = ({wrapperClasses = "", rowTextClasses = "", rowClasses = "", children, text, icon, label = "", array = []}) => {
    return (
        <>
            {Manager.IsValid(text, true) && (
                <div className={`detail-row-wrapper${wrapperClasses ? ` ${wrapperClasses}` : ""}`}>
                    <div className="svg-wrapper">{icon}</div>
                    <div className={`detail-row${rowClasses ? ` ${rowClasses}` : ""}`}>
                        <div className="label-and-icon">
                            <p>{label}</p>
                        </div>
                        {!children && (
                            <StringAsHtmlElement
                                text={text}
                                elementType={"p"}
                                classes={`detail-row-text${rowTextClasses ? ` ${rowTextClasses}` : ""}`}
                            />
                        )}
                    </div>
                </div>
            )}
            {!Manager.IsValid(text, true) && Manager.IsValid(array) && (
                <div className={`with-tags detail-row-wrapper${wrapperClasses ? ` ${wrapperClasses}` : ""}`}>
                    <div className="svg-wrapper">{icon}</div>
                    <div className="label-and-icon">
                        <p>{label}</p>
                    </div>
                    <div className={"tags"}>
                        {Manager.IsValid(array) &&
                            array?.map((item, index) => {
                                return (
                                    <StringAsHtmlElement
                                        key={index}
                                        text={item}
                                        elementType={"span"}
                                        classes={`detail-row-text tag${rowTextClasses ? ` ${rowTextClasses}` : ""}`}
                                    />
                                )
                            })}
                    </div>
                </div>
            )}
        </>
    )
}

export default DetailRow