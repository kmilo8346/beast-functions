import express from "express";
import * as functions from "firebase-functions";

import providerClient from "./clients/provider-client";

const router = express.Router();
const prefix = "[mercado pago payment provider]";

router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    switch (req.body.type) {
      case "payment":
        await providerClient.updatePayment(req.body);
        break;
      default:
        functions.logger.warn(
          `${prefix} Webhook type not mapped, type: ${req.body.type}`
        );
        break;
    }
    res.json({ status: "OK" });
  } catch (error) {
    functions.logger.debug(req.body);
    functions.logger.error(error);

    functions.logger.error(
      `${prefix} Unexpected error listening mercado pago webhooks`
    );

    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
