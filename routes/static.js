
const express = require('express');
const router = express.Router();

// Set up "public" folder / subfolders for static files
router.use(express.static("public"));
router.use("/css", express.static("public/css"));
router.use("/js", express.static("public/js"));
router.use("/images", express.static("public/images"));

module.exports = router;
