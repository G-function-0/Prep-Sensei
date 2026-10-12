import Vapi from "@vapi-ai/web";

const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN || "demo-vapi-token";
export const vapi = new Vapi(token);