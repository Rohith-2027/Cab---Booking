import dotenv from "dotenv";
dotenv.config();

import "./jobs/openMarket.job.js";
import "./jobs/expireBookings.job.js";

console.log("Worker started: cron jobs enabled");
