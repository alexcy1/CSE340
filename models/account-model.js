const pool = require("../database/")
const bcrypt = require("bcrypt")



/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password){
  try {
    const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *"
    return await pool.query(sql, [account_firstname, account_lastname, account_email, account_password])
  } catch (error) {
    return error.message
  }
}



/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email){
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email = await pool.query(sql, [account_email])
    return email.rowCount
  } catch (error) {
    return error.message
  }
}



/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail (account_email) {
  try {
    const result = await pool.query(
      'SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_email = $1',
      [account_email])
    return result.rows[0]
  } catch (error) {
    return new Error("No matching email found")
  }
}



/* **********************
 * Check password
 * ********************* */
async function checkPassword(inputPassword, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    return error.message;
  }
}



/* *****************************
 * Return account data using account_id
 * ***************************** */
async function getAccountById(account_id) {
  try {
    const result = await pool.query(
      "SELECT account_id, account_firstname, account_lastname, account_email, account_type FROM account WHERE account_id = $1",
      [account_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("getAccountById error: " + error);
    return null;
  }
}



/* *****************************
 * Update account information
 * ***************************** */
async function updateAccount(account_id, account_firstname, account_lastname, account_email) {
  try {
    const sql = `
      UPDATE account
      SET account_firstname = $1, account_lastname = $2, account_email = $3
      WHERE account_id = $4
      RETURNING *`;
    const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_id]);
    return result.rows[0];
  } catch (error) {
    console.error("updateAccount error: " + error);
    return null;
  }
}



/* *****************************
 * Update account password
 * ***************************** */
async function updatePassword(account_id, account_password) {
  try {
    const sql = `
      UPDATE account
      SET account_password = $1
      WHERE account_id = $2
      RETURNING *`;
    const result = await pool.query(sql, [account_password, account_id]);
    return result.rows[0];
  } catch (error) {
    console.error("updatePassword error: " + error);
    return null;
  }
}




// =========================== MY PROJECT IN VIEW =============================

/* *****************************
 * Return all users (Admin only)
 * ***************************** */
async function getAllUsers() {
  try {
    const result = await pool.query(
      "SELECT account_id, account_firstname, account_lastname, account_email, account_type FROM account"
    );
    return result.rows;
  } catch (error) {
    console.error("getAllUsers error: " + error);
    return null;
  }
}



/* *****************************
 * Return users with orders (Admin only)
 * ***************************** */
async function getUsersWithOrders() {
  try {
    const sql = `
      SELECT DISTINCT
        a.account_id,
        a.account_firstname,
        a.account_lastname,
        a.account_email
      FROM account a
      JOIN orders o ON a.account_id = o.account_id
    `;

    console.log("Executing SQL query:", sql);
    const result = await pool.query(sql);
    console.log("Query result:", result.rows);
    return result.rows;
  } catch (error) {
    console.error("getUsersWithOrders error:", error);
    return [];
  }
}



/* *****************************
 * Delete a user by ID (Admin only)
 * ***************************** */
async function deleteUserById(account_id) {
  try {
    const sql = "DELETE FROM account WHERE account_id = $1";
    const result = await pool.query(sql, [account_id]);
    return result.rowCount > 0; 
  } catch (error) {
    console.error("deleteUserById error: " + error);
    return false;
  }
}



/* *****************************
 * Delete a specific history item by ID
 * ***************************** */
async function deleteHistoryItem(history_id) {
  try {
    if (!history_id || isNaN(history_id)) {
      return {
        success: false,
        message: "Invalid history item ID.",
      };
    }

    const sql = "DELETE FROM order_history WHERE history_id = $1 RETURNING *";
    const result = await pool.query(sql, [history_id]);

    return {
      success: result.rowCount > 0,
      message: result.rowCount > 0 ? "History item deleted successfully." : "No history item found with the provided ID.",
    };
  } catch (error) {
    console.error("deleteHistoryItem error:", error);
    return {
      success: false,
      message: "An error occurred while deleting the history item.",
    };
  }
}



/* *****************************
 * Delete all history items for a user or all users (Admin only)
 * ***************************** */
async function deleteAllHistory(account_id = null) {
  try {
    let sql;
    let params;

    if (account_id) {
      // Delete history items for a specific user
      sql = `
        DELETE FROM order_history
        WHERE order_id IN (
          SELECT order_id FROM orders WHERE account_id = $1
        )
        RETURNING *
      `;
      params = [account_id];
    } else {
      // Delete all history items (Admin only)
      sql = "DELETE FROM order_history RETURNING *";
      params = [];
    }

    const result = await pool.query(sql, params);
    return {
      success: true,
      message: `${result.rowCount} history items deleted successfully.`,
      count: result.rowCount,
    };
  } catch (error) {
    console.error("deleteAllHistory error:", error);
    return {
      success: false,
      message: "An error occurred while deleting history items.",
    };
  }
}



/* *****************************
 * Submit a contact form
 * ***************************** */
async function submitContactForm(account_id, contact_name, contact_email, contact_message, contact_file = null) {
  try {
    const sql = `
      INSERT INTO contact_submissions (account_id, contact_name, contact_email, contact_message, contact_file)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(sql, [account_id, contact_name, contact_email, contact_message, contact_file]);
    return result.rows[0];
  } catch (error) {
    console.error("submitContactForm error:", error);
    return null;
  }
}



/* *****************************
 * Get all contact submissions for a user
 * ***************************** */
async function getUserContactSubmissions(account_id) {
  try {
    const sql = "SELECT * FROM contact_submissions WHERE account_id = $1 ORDER BY contact_date DESC";
    const result = await pool.query(sql, [account_id]);
    return result.rows;
  } catch (error) {
    console.error("getUserContactSubmissions error:", error);
    return null;
  }
}



/* *****************************
 * Get all contact submissions (Admin only)
 * ***************************** */
async function getAllContactSubmissions() {
  try {
    const sql = "SELECT * FROM contact_submissions ORDER BY contact_date DESC";
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("getAllContactSubmissions error:", error);
    return null;
  }
}



/* *****************************
 * Get a specific contact submission by ID
 * ***************************** */
async function getContactSubmissionById(contact_id) {
  try {
    const sql = "SELECT * FROM contact_submissions WHERE contact_id = $1";
    const result = await pool.query(sql, [contact_id]);
    return result.rows[0];
  } catch (error) {
    console.error("getContactSubmissionById error:", error);
    return null;
  }
}



/* *****************************
 * Delete a contact submission by ID
 * ***************************** */
async function deleteContactSubmission(contact_id) {
  try {
    const sql = "DELETE FROM contact_submissions WHERE contact_id = $1 RETURNING *";
    const result = await pool.query(sql, [contact_id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("deleteContactSubmission error:", error);
    return false;
  }
}


module.exports = {
  registerAccount,
  checkExistingEmail,
  checkPassword,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,

  getAllUsers,
  deleteUserById,
  getUsersWithOrders,

  deleteHistoryItem,
  deleteAllHistory,

  submitContactForm,
  getUserContactSubmissions,
  getAllContactSubmissions,
  getContactSubmissionById,
  deleteContactSubmission
};
