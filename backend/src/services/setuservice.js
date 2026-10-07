const axios = require("axios");

let cached = { token: null, exp: 0 };

async function getToken() {
  if (cached.token && Date.now() < cached.exp) return cached.token;
  
  const authUrl = process.env.SETU_AUTH_URL || "https://accountservice.setu.co/v1/users/login";
  const { data } = await axios.post(
    authUrl,
    {
      clientID: process.env.SETU_CLIENT_ID,
      secret: process.env.SETU_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
    { headers: { client: "bridge", "Content-Type": "application/json" } }
  );

  const token = data.access_token || data.data?.access_token;
  if (!token) throw new Error("No access token in Setu response: " + JSON.stringify(data));
  cached = { token, exp: Date.now() + 4 * 60 * 1000 };
  return token;
}

async function aa(method, path, body) {
  const token = await getToken();
  const baseUrl = process.env.SETU_AA_BASE_URL || "https://fiu-sandbox.setu.co/v2";
  
  const { data } = await axios({
    method,
    url: `${baseUrl}${path}`,
    data: body,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID,
      "Content-Type": "application/json",
    },
  });
  return data;
}

exports.createConsent = (mobile) => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3); // 3-month transaction history
  
  // In the Account Aggregator sandbox, valid handles are @onemoney or @finvu (not @setu)
  const vua = mobile.includes("@") ? mobile : `${mobile}@onemoney`;

  return aa("post", "/consents", {
    vua,
    consentMode: "VIEW",
    dataLife: { unit: "MONTH", value: 0 }, // Required to be 0 for VIEW mode under RBI AA rules
    consentDuration: { unit: "MONTH", value: 1 },
    dataRange: { from: from.toISOString(), to: to.toISOString() },
    context: [],
  });
};

exports.getConsent = (id) => aa("get", `/consents/${id}`);

exports.createSession = (consentId, dataRange) =>
  aa("post", "/sessions", { consentId, dataRange, format: "json" });

exports.getSession = (id) => aa("get", `/sessions/${id}`);