const clientIo = io("http://localhost:3000/", {
  auth: { authorization: "BearerToken" },
});

clientIo.on("connect", () => {
  console.log(`server stablish connection successfully`);
});
clientIo.on("connect_error", () => {
  console.log(`connection error ${error.message}`);
});
clientIo.on("offline_user", (data) => {
  console.log(data);
});

clientIo.on("productStock", (data, callBack) => {
  console.log({ product: data });
  callBack("doonne");
});
