
const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController")
const utilities = require("../utilities/")
const regValidate = require('../utilities/account-validation')
const multer = require("multer");
const path = require("path");



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images/contact"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); 
  },
});

const upload = multer({ storage });

module.exports = {
  upload,
};


// Route to deliver login view
router.get(
  "/login",
  utilities.handleErrors(accountController.buildLogin))

// Route to deliver registration view
router.get(
  "/register",
  utilities.handleErrors(accountController.buildRegister))

// Process the registration data
router.post(
    "/register",
    regValidate.registationRules(),
    regValidate.checkRegData,
    utilities.handleErrors(accountController.registerAccount)
  )

// Process the login attempt
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

// New default route for account management
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement))

// Logout route
router.get(
  "/logout",
  utilities.handleErrors(accountController.logoutAccount))

// Route to deliver account update view
router.get(
  "/update/:accountId",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildAccountUpdate));

// Route to process account update
router.post(
  "/update",
  utilities.checkLogin,
  utilities.handleErrors(accountController.updateAccount));

// Route to process password change
router.post(
  "/change-password",
  utilities.checkLogin,
  utilities.handleErrors(accountController.changePassword));

// Route to deliver password change view
router.get(
  "/change-password",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildChangePassword));


// =========================== MY PROJECT IN VIEW =============================
// Route to display all users (Admin only)
router.get(
  "/manage-users",
  utilities.checkLogin,
  utilities.checkAdmin,
  utilities.handleErrors(accountController.buildManageUsers));

// Route to delete a user (Admin only)
router.post(
  "/delete-user/:accountId",
  utilities.checkLogin,
  utilities.checkAdmin,
  utilities.handleErrors(accountController.deleteUser));

// Route to place order
router.post(
  "/place-order",
  utilities.checkLogin,
  utilities.handleErrors(accountController.placeOrder)
);

// Route to orders
router.get(
  "/orders",
  utilities.checkLogin,
  utilities.handleErrors(accountController.viewOrders)
);

// Route to manage orders
router.get(
  "/manage-orders",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(accountController.manageOrders)
);

// Route to update order status
router.post(
  "/update-order",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(accountController.updateOrder)
);

// Route to delete order
router.post(
  "/delete-order",
  utilities.checkLogin,
  utilities.handleErrors(accountController.deleteOrder)
);

// Route to order history
router.get(
  "/order-history",
  utilities.checkLogin,
  utilities.handleErrors(accountController.viewOrderHistory)
);

// Delete single order history
router.post(
  "/delete-history-item",
  utilities.checkLogin,
  utilities.handleErrors(accountController.deleteHistoryItem)
);

// Delete all order history
router.post(
  "/delete-all-history",
  utilities.checkLogin,
  utilities.handleErrors(accountController.deleteAllHistory)
);

// Display user's List
router.get(
  "/user-list",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(accountController.viewUserList)
);

// Users specific ID to order page
router.get(
  "/manage-orders/:userId",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(accountController.viewUserOrders)
);


// Route to display the contact form
router.get(
  "/contact",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildContactForm)
);

// Route to process the contact form submission
router.post(
  "/contact",
  utilities.checkLogin,
  upload.single("contact_file"), // Handle file upload
  regValidate.contactFormRules(),
  regValidate.checkContactFormData,
  utilities.handleErrors(accountController.submitContactForm)
);

// Route to display user's contact submissions
router.get(
  "/contact-submissions",
  utilities.checkLogin,
  utilities.handleErrors(accountController.viewUserContactSubmissions)
);

// Route to display all contact submissions (Admin only)
router.get(
  "/admin/contact-submissions",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(accountController.viewAllContactSubmissions)
);

// Route to delete a contact submission (Admin only)
router.post(
  "/delete-contact-submission",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(accountController.deleteContactSubmission)
);


// Export the router module
module.exports = router
