import crypto from "crypto";

export const generateChecksum = (payload) => {
  const base64Payload = Buffer.from(
    JSON.stringify(payload)
  ).toString("base64");

  const stringToHash =
    base64Payload +
    "/pg/v1/pay" +
    process.env.PHONEPE_SALT_KEY;

  const sha256 = crypto
    .createHash("sha256")
    .update(stringToHash)
    .digest("hex");

  const checksum =
    sha256 + "###" + process.env.PHONEPE_SALT_INDEX;

  return { base64Payload, checksum };
};
