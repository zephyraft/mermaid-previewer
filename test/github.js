export const addLoginCookie = async (driver, env) => {
  console.log("env", env);

  await driver.manage().addCookie({
    name: "user_session",
    value: env.SESSION
  });
  await driver.manage().addCookie({
    name: "__Host-user_session_same_site",
    value: env.SESSION
  });
  await driver.manage().addCookie({
    name: "logged_in",
    value: "yes"
  });
  await driver.manage().addCookie({
    name: "dotcom_user",
    value: "zephyraft"
  });
  await driver.manage().addCookie({
    name: "tz",
    value: "Asia%2FShanghai"
  });
  await driver.manage().addCookie({
    name: "has_recent_activity",
    value: "1"
  });
  await driver.manage().addCookie({
    name: "_gh_sess",
    value: env.GH_SESSION
  });
};
