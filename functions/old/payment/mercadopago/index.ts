import * as functions from "firebase-functions";
import * as express from "express";

const prefix = "[mercado pago webhooks]";
const router = express.Router();

router.post("/", async function getUser(req: express.Request, res: express.Response) { 
  try {
    const data = req.body;

    switch(req.body.type) {
        case "payment":
            
            // get payment from mercado pago
            // get payment from elastic
            // update {status, y agrego payment_id a checkout meta_data
            // emito payment.status
            // mercadopago.payment.approved


            // on mercadopago.payment.approved -> order.created
            // confirm -> order.confirmed
            // confirm -> order.confirmed

            break;
        default:
            functions.logger.warn(`${prefix} Webhook type not mapped, type: ${req.body.type}`);
            break;
    }

    res.json({status: 'OK'});
  } catch (error) {
    functions.logger.debug(req.body);
    functions.logger.error(error);
    functions.logger.error(`${prefix} Unexpected error listening mercado pago webhooks`);
    
    res.status(500).json({
      message: error.message,
    });
  }
  const uid = req.params.uid;
  res.status(200).send(`You requested user with UID = ${uid}`);

});


export default router;