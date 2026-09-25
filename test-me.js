const http = require("http");

const loginData = JSON.stringify({
  email: "securitytest@pims.com",
  password: "TestUser@12345",
});

const loginOptions = {
  hostname: "localhost",
  port: 5000,
  path: "/api/auth/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(loginData),
  },
};

const loginReq = http.request(loginOptions, (loginRes) => {
  let body = "";

  loginRes.on("data", (chunk) => {
    body += chunk;
  });

  loginRes.on("end", () => {
    const loginResult = JSON.parse(body);
    const token = loginResult.data.token;

    const meOptions = {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/admin-test",
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const meReq = http.request(meOptions, (meRes) => {
      let meBody = "";

      meRes.on("data", (chunk) => {
        meBody += chunk;
      });

      meRes.on("end", () => {
        console.log("ME Status:", meRes.statusCode);
        console.log("ME Response:", meBody);
      });
    });

    meReq.on("error", (error) => {
      console.error("ME request failed:", error.message);
    });

    meReq.end();
  });
});

loginReq.on("error", (error) => {
  console.error("Login request failed:", error.message);
});

loginReq.write(loginData);
loginReq.end();