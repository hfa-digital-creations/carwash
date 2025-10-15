import express from "express"
import customerRouters from "./customerRoutes.js"
import washBookingRoutes from "./washBookingRoutes.js"
import addressRoutes from "./addressRoutes.js";
import CustomerShoppingRoutes from "./CustomerShoppingRoutes.js"
import ServiceBookingRoutes from "./serviceBookingRoutes.js"
import vouchersRoutes from "./CustomerShoppingRoutes.js"
import customerBannerRoutes from "./customerBannerRoutes.js";
import serviceTypeRoutes from "./serviceTypeRoutes.js"
import ratingRoutes from "./ratingRoutes.js"
import cartRoutes from "./cartRoutes.js"
import contactQueryRoutes from "./contactQueryRoutes.js"

import washerRegisterroutes from "./washerEmp.RegisterRoutes.js"
import washerEmpScheduleRoutes from "./WasherEmpScheduleRoutes.js";

import DeliveryPersonScheduleRoutes from "./DeliveryPersonScheduleRoutes.js";
const router = express.Router()

router.get("/", (req, res) => {
    res.send("backend working fine")
});

router.use("/User",customerRouters)
router.use("/banner",customerBannerRoutes)
router.use("/service", serviceTypeRoutes);
router.use("/washBooking",washBookingRoutes)
router.use("/addToCart" , cartRoutes)
router.use("/CustomerShopping", CustomerShoppingRoutes);
router.use("/ServiceBooking",ServiceBookingRoutes)
router.use("/vouchers",vouchersRoutes )
router.use("/RatingS", ratingRoutes);
router.use("/address", addressRoutes);
router.use("./contactQuery",contactQueryRoutes)

// -------------------- WASHER EMPLOY FLOW --------------------
router.use("/washerEmp",washerRegisterroutes )
router.use("/washerEmpShedule",washerEmpScheduleRoutes )

// -------------------- Delivery Person FLOW --------------------
router.use("/DeliveryPerson" ,DeliveryPersonScheduleRoutes)
export default router