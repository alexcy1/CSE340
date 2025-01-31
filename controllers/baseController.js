
const utilities = require("../utilities/")
const baseController = {}

baseController.buildHome = async (req, res) => {
  const nav = await utilities.getNav()
  // req.flash("notice", "This is a flash message.")
  res.render("index", { title: "Home", nav })
}




// TESTING ACCOUNT LOGIN | CAN BE DELETED FOR NOW ==============================
baseController.buildHome = async (req, res) => {
  const nav = await utilities.getNav();
  const account_firstname = req.session.account ? req.session.account.account_firstname : null; // Get the user's first name from the session
  res.render("index", {
    title: "Home",
    nav,
    account_firstname, // Pass the user's first name to the view
    messages: req.flash(), // Pass flash messages
  });
};


module.exports = baseController
