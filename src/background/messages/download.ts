import { downloads } from "webextension-polyfill";

import type { PlasmoMessaging } from "@plasmohq/messaging";

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  await downloads.download({
    filename: req.body.filename,
    url: req.body.url,
  });

  res.send({
    message: "success",
  });
};

export default handler;
