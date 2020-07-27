// @ts-ignore
import mercadopago from "mercadopago";

import config from '../../lib/config'

mercadopago.configure({
  access_token: config.get('mercado_pago.access_token'),
});

export default mercadopago;
