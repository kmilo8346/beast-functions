// @ts-ignore
import mercadopago from "mercadopago";
import * as functions from "firebase-functions";

mercadopago.configure({
  access_token: functions.config().mercado_pago.access_token,
});

export default mercadopago;
