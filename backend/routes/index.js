import express from "express"
import customerRouters from "./customerRoutes.js"
import washBookingRoutes from "./washBookingRoutes.js"
import addressRoutes from "./addressRoutes.js";
import CustomerShoppingRoutes from "./CustomerShoppingRoutes.js"
import ServiceBookingRoutes from "./serviceBookingRoutes.js"
const router = express.Router()

router.get("/", (req, res) => {
    res.send("backend working fine")
});

router.use("/User",customerRouters)
router.use("/washBooking",washBookingRoutes)
router.use("/address", addressRoutes);
router.use("/CustomerShopping", CustomerShoppingRoutes);
router.use("/ServiceBooking",ServiceBookingRoutes)

export default router