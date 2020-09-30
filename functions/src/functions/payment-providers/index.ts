import express from "express";

import mercadopago from './mercadopago'

const router = express.Router();

router.use("/mercadopago", mercadopago);

export default {
    router,
};