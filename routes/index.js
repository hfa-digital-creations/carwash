import express from "express"
import customerRouters from "./customerRoutes.js"
import washBookingRoutes from "./washBookingRoutes.js"
import addressRoutes from "./addressRoutes.js";
import CustomerShoppingRoutes from "./CustomerShoppingRoutes.js"
import ServiceBookingRoutes from "./serviceBookingRoutes.js"
import vouchersRoutes from "./CustomerShoppingRoutes.js"

import washerRegisterroutes from "./washerEmp.RegisterRoutes.js"
const router = express.Router()

router.get("/", (req, res) => {
    res.send("backend working fine")
});

router.use("/User",customerRouters)
router.use("/washBooking",washBookingRoutes)
router.use("/address", addressRoutes);
router.use("/CustomerShopping", CustomerShoppingRoutes);
router.use("/ServiceBooking",ServiceBookingRoutes)
router.use("/vouchers",vouchersRoutes )

// -------------------- WASHER EMPLOY FLOW --------------------
router.use("/washerEmp",washerRegisterroutes )


export default router