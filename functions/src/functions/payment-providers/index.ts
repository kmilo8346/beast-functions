import express from "express";

import mercadopago from './mercadopago'

const router = express.Router();

router.use("/mercadopago", mercadopago);
// router.use("/lider", lider);

export default {
    router,
    // listeners: {}
};