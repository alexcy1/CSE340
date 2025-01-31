
const utilities = require("../utilities")
const accountModel = require("../models/account-model")


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


/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
    const { account_firstname, account_lastname, account_email, account_password } = req.body;

    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      account_password
    );

    if (regResult) {
      req.flash(
        "success",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      );
      res.redirect("/account/login"); // Redirect instead of rendering
    } else {
      let nav = await utilities.getNav(); // Get nav for rendering
      req.flash("error", "Sorry, the registration failed.");
      res.status(501).render("account/register", {
        title: "Registration",
        nav,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    }
  }


// TESTING ACCOUNT LOGIN | CAN BE DELETED FOR NOW ============================
/* ****************************************
 * Process Login
 * *************************************** */
async function processLogin(req, res) {
  const { account_email, account_password } = req.body;

  // Check if the email exists in the database
  const account = await accountModel.getAccountByEmail(account_email);

  if (!account) {
    req.flash("error", "Invalid email or password.");
    res.redirect("/account/login");
    return;
  }

  // Check if the password is correct
  const isPasswordValid = await accountModel.checkPassword(
    account_password,
    account.account_password
  );

  if (!isPasswordValid) {
    req.flash("error", "Invalid email or password.");
    res.redirect("/account/login");
    return;
  }

  // If login is successful, set session and redirect
  req.session.account = {
    account_id: account.account_id,
    account_firstname: account.account_firstname, // Store the user's first name
    account_email: account.account_email,
  };

  req.flash("success", `Welcome back, ${account.account_firstname}! You are now logged in.`);
  res.redirect("/");
}

module.exports = { buildLogin, buildRegister, registerAccount, processLogin }
