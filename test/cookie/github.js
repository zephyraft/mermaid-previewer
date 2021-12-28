export const addGithubCookie = async (driver) => {
  const env = process.env;
  console.log("env", env);

  await driver.manage().addCookie({
    name: "user_session",
    value: env.GH_U_SESSION
  });
  await driver.manage().addCookie({
    name: "__Host-user_session_same_site",
    value: env.GH_U_SESSION
  });
  await driver.manage().addCookie({
    name: "_gh_sess",
    value: env.GH_SESSION
  });
};
