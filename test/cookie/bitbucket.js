export const addBitbucketCookie = async (driver) => {
  const env = process.env;
  console.log("env", env);

  await driver.manage().addCookie({
    name: "cloud.session.token",
    value: env.BB_SESSION
  });

};
