import util from "./util";

const apiKey = "addaaacd055b791f6ed5f5beed9657cca61dcb7314IDt0RNQhGwgujgErSIVErg6";

const SmsUtil = {
  lineBreak: "\r\n",
  signature: `\r\nThank You,\r\nPEACEFUL coPARENTING`,
  getNewCalEventTemplate: (title, date, createdBy) => {
    return `A new Shared Calendar event has been created by ${createdBy}${SmsUtil.lineBreak}${SmsUtil.lineBreak}Title: ${title}${SmsUtil.lineBreak}Date: ${date}${SmsUtil.lineBreak}${SmsUtil.signature}`;
  },
  getNewExpenseTemplate: (title, amount, createdBy) => {
    return `A new Expense has been created by ${createdBy}${SmsUtil.lineBreak}${SmsUtil.lineBreak}Expense: ${title}${SmsUtil.lineBreak}Amount: $${amount}${SmsUtil.lineBreak}${SmsUtil.signature}`;
  },
  getNewSwapRequestTemplate: (date, createdBy) => {
    return `A new Swap Request has been created by ${createdBy}${SmsUtil.lineBreak}${SmsUtil.lineBreak}Date(s): ${date}${SmsUtil.lineBreak}${SmsUtil.signature}`;
  },
  getSwapRequestDecisionTemplate: (date, decision, reason, createdBy) => {
    let decisionText = "APPROVED";
    if (decision === "rejected") decisionText = "REJECTED";
    return `A new Swap Request decision for ${date} has been made by ${createdBy}${SmsUtil.lineBreak}${SmsUtil.lineBreak}Decision: ${decisionText}${SmsUtil.lineBreak}${reason && reason.length > 0 ? "Reason:" + reason : ""}${SmsUtil.signature}`;
  },
  getMarkAsPaidTemplate: (coparent, expenseName) => {
    return `An expense has been PAID by ${coparent}${SmsUtil.lineBreak}${SmsUtil.lineBreak}Expense Name: ${expenseName}${SmsUtil.lineBreak}${SmsUtil.signature}`;
  },
  getVerificationCodeTemplate: (code, senderName) => {
    return `Below is your verification code from ${senderName}. You will need to enter this code upon login to use the app, to ensure privacy. ${SmsUtil.lineBreak}${SmsUtil.lineBreak}Code: ${code}${SmsUtil.lineBreak}Please login (register if you haven't already) and enter the code.${SmsUtil.lineBreak}${SmsUtil.signature}`;
  },
  send: (phoneNumber, message) => {
    // if (location.hostname !== "localhost") {
    fetch("https://textbelt.com/text", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phoneNumber,
        message: message,
        key: apiKey,
      }),
    })
      .then((data) => {
        console.log(data);
        const textsRemaining = data["quotaRemaining"];
        if (textsRemaining <= 5) {
          SmsUtil.send("3307494534", "Fund SMS account immediately!");
        }
      })
      .then((data) => {
        console.log(data);
      });
    // }
  },
};

export default SmsUtil;
