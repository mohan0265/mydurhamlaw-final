// netlify/functions/gemini-realtime-sdp.js

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:connectRealtime";

exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: "Method Not Allowed",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: "Missing GEMINI_API_KEY in environment",
    };
  }

  try {
    const resp = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
      },
      body: event.body,
    });

    const text = await resp.text();

    return {
      statusCode: resp.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/sdp",
      },
      body: text,
    };
  } catch (err) {
    console.error("Gemini realtime proxy error:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: "Error contacting Gemini Realtime API",
    };
  }
};
