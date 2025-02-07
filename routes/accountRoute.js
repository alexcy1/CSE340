
const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController")
const utilities = require("../utilities/")
const regValidate = require('../utilities/account-validation')


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

// Export the router module
module.exports = router
