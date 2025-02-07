
const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
require("dotenv").config()




/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    account_email: "",
    messages: req.flash(),
  });
}



/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav()
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
  })
}



/****************************************
 *  Process Registration
 * *************************************** */
async function registerAccount(req, res) {
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  // Hash the password
  let hashedPassword
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10)
    // Hash the password using the salt
    hashedPassword = await bcrypt.hash(account_password, salt)
    console.log("Password hashed successfully")
  } catch (error) {
    console.error("Error in password hashing:", error)
    req.flash("error", "Error registering account.")
    const nav = await utilities.getNav()
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
    return
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword,
  )

  if (regResult) {
    req.flash("success", `Congratulations, you're registered ${account_firstname}. Please log in.`)
    res.redirect("/account/login")
  } else {
    const nav = await utilities.getNav()
    req.flash("error", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
  }
}



/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  console.log("Login process started")
  const { account_email, account_password } = req.body
  console.log(`Attempting login for email: ${account_email}`)

  try {
    const accountData = await accountModel.getAccountByEmail(account_email)
    console.log("Account data retrieved:", accountData ? "Found" : "Not Found")

    if (!accountData) {
      console.log("Account not found, sending error response")
      req.flash("error", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav: await utilities.getNav(),
        errors: null,
        account_email,
        messages: req.flash(),
      })
    }

    console.log("Comparing passwords")
    const passwordsMatch = await bcrypt.compare(account_password, accountData.account_password)
    console.log("Passwords match:", passwordsMatch)

    if (passwordsMatch) {
      console.log("Passwords match, creating JWT")
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      req.flash("success", "You have successfully logged in.")
      console.log("JWT created and set in cookie, redirecting to /account/")
      return res.redirect("/account/")
    } else {
      console.log("Passwords do not match, sending error response")
      req.flash("error", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav: await utilities.getNav(),
        errors: null,
        account_email,
        messages: req.flash(),
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    req.flash("error", "An error occurred during login. Please try again.")
    return res.status(500).render("account/login", {
      title: "Login",
      nav: await utilities.getNav(),
      errors: null,
      account_email,
      messages: req.flash(),
    })
  }
}



/* ****************************************
 *  Deliver Account Management View
 * ************************************ */
async function buildAccountManagement(req, res, next) {
  console.log("Building account management view");
  const nav = await utilities.getNav();
  const accountData = res.locals.accountData;

  res.render("account/management", {
    title: "Account Management",
    nav,
    errors: null,
    messages: req.flash(),
    accountData,
  });
}



/* ****************************************
 *  Deliver Account Update View
 * ************************************ */
async function buildAccountUpdate(req, res, next) {
  const nav = await utilities.getNav();
  const accountId = Number.parseInt(req.params.accountId);
  const accountData = await accountModel.getAccountById(accountId);

  res.render("account/update", {
    title: "Update Account",
    nav,
    errors: null,
    accountData,
    messages: req.flash(),
  });
}



/* ****************************************
 *  Process Account Update
 * ************************************ */
async function updateAccount(req, res, next) {
  const { account_id, account_firstname, account_lastname, account_email } = req.body;

  const errors = [];
  if (!account_firstname) errors.push({ msg: "First name is required." });
  if (!account_lastname) errors.push({ msg: "Last name is required." });
  if (!account_email) errors.push({ msg: "Email is required." });

  if (errors.length > 0) {
    const nav = await utilities.getNav();
    return res.render("account/update", {
      title: "Update Account",
      nav,
      errors,
      accountData: { account_id, account_firstname, account_lastname, account_email },
      messages: req.flash(),
    });
  }

  const updateResult = await accountModel.updateAccount(account_id, account_firstname, account_lastname, account_email);

  if (updateResult) {
    const updatedAccountData = {
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      account_type: res.locals.accountData.account_type,
    };

    const accessToken = jwt.sign(updatedAccountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 });
    res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 });

    req.flash("success", "Account updated successfully.");
    res.redirect("/account/");
  } else {
    req.flash("error", "Sorry, the account update failed.");
    res.redirect(`/account/update/${account_id}`);
  }
}



/* ****************************************
 *  Process Password Change
 * ************************************ */
async function changePassword(req, res, next) {
  const { account_id, account_password } = req.body;

  // Hash the new password
  let hashedPassword;
  try {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(account_password, salt);
  } catch (error) {
    console.error("Error hashing password:", error);
    req.flash("error", "Error changing password.");
    return res.redirect(`/account/update/${account_id}`);
  }

  // Update password in the database
  const updateResult = await accountModel.updatePassword(account_id, hashedPassword);

  if (updateResult) {
    // Clear JWT cookie and redirect to login page
    res.clearCookie("jwt");
    req.flash("success", "Password changed successfully. Please log in with your new password.");
    res.redirect("/account/login");
  } else {
    req.flash("error", "Sorry, the password change failed.");
    res.redirect(`/account/update/${account_id}`);
  }
}



async function buildChangePassword(req, res, next) {
  const nav = await utilities.getNav();
  const accountData = res.locals.accountData;

  res.render("account/change-password", {
    title: "Change Password",
    nav,
    errors: null,
    accountData,
    messages: req.flash(),
  });
}


/* ****************************************
 *  Process logout request
 * ************************************ */
async function logoutAccount(req, res) {
  res.clearCookie("jwt")
  res.redirect("/")
}



// =========================== MY PROJECT IN VIEW =============================

/* ****************************************
 *  Deliver Manage Users View (Admin Only)
 * ************************************ */
async function buildManageUsers(req, res, next) {
  const nav = await utilities.getNav();
  const accountData = res.locals.accountData;

  // Fetch all users from the database
  const users = await accountModel.getAllUsers();

  res.render("account/manage-users", {
    title: "Manage Users",
    nav,
    errors: null,
    messages: req.flash(),
    accountData,
    users, // Pass the list of users to the view
  });
}


/* ****************************************
 *  Delete a User (Admin Only)
 * ************************************ */
async function deleteUser(req, res, next) {
  const accountId = req.params.accountId;

  // Delete the user from the database
  const deleteResult = await accountModel.deleteUserById(accountId);

  if (deleteResult) {
    req.flash("success", "User deleted successfully.");
  } else {
    req.flash("error", "Sorry, the user deletion failed.");
  }

  res.redirect("/account/manage-users");
}


module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  buildAccountManagement,
  accountLogin,
  logoutAccount,
  buildAccountUpdate,
  updateAccount,
  changePassword,
  buildChangePassword,

  buildManageUsers,
  deleteUser
}
