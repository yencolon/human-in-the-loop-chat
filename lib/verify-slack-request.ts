import crypto from "crypto";

export function verifySlackRequest(request: Request, rawBody: string): boolean {
  try {
    const slackSignature =
      request.headers.get("x-slack-signature") ||
      request.headers.get("X-Slack-Signature");

    const slackTimestamp =
      request.headers.get("x-slack-request-timestamp") ||
      request.headers.get("X-Slack-Request-Timestamp");

    if (!slackSignature || !slackTimestamp) {
      console.error("❌ Missing Slack headers");
      return false;
    }

    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("❌ SLACK_SIGNING_SECRET not configured");
      return false;
    }

    const timestampNum = parseInt(slackTimestamp);
    const currentTime = Math.floor(Date.now() / 1000);

    if (isNaN(timestampNum) || Math.abs(currentTime - timestampNum) > 300) {
      console.error("❌ Invalid timestamp");
      return false;
    }

    const sigBaseString = `v0:${slackTimestamp}:${rawBody}`;
    const expectedSignature =
      "v0=" +
      crypto
        .createHmac("sha256", signingSecret)
        .update(sigBaseString)
        .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(slackSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );

    if (!isValid) {
      console.error("❌ Signature mismatch");
      console.log("Received:", slackSignature);
      console.log("Expected:", expectedSignature);
    }

    return isValid;
  } catch (error) {
    console.error("❌ Error in verification:", error);
    return false;
  }
}
