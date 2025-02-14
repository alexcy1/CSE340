
const pool = require("../database/")


/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}



/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i
        JOIN public.classification AS c
        ON i.classification_id = c.classification_id
        WHERE i.classification_id = $1`,
      [classification_id],
    )
    return data.rows
  } catch (error) {
    console.error("getclassificationsbyid error " + error)
  }
}



/* ***************************
 *  Get vehicle by inv_id
 * ************************** */
async function getVehicleById(inv_id) {
  try {
    const data = await pool.query(`SELECT * FROM public.inventory WHERE inv_id = $1`, [inv_id])
    return data.rows[0]
  } catch (error) {
    console.error("getvehiclebyid error " + error)
  }
}



/* ***************************
 *  Add new classification
 * ************************** */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *"
    const result = await pool.query(sql, [classification_name])
    return result.rows[0]
  } catch (error) {
    console.error("addclassification error " + error)
    return null
  }
}



/* ***************************
 *  Add new inventory item
 * ************************** */
async function addInventory(inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id) {
  try {
    const sql = "INSERT INTO inventory (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"
    const result = await pool.query(sql, [inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id])
    return result.rows[0]
  } catch (error) {
    console.error("addInventory error " + error)
    return null
  }
}



/* ***************************
 *  Update Inventory Data
 * ************************** */
async function updateInventory(
  inv_id,
  inv_make,
  inv_model,
  inv_year,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_miles,
  inv_color,
  classification_id
) {
  try {
    const sql = `
      UPDATE inventory
      SET
        inv_make = $1,
        inv_model = $2,
        inv_year = $3,
        inv_description = $4,
        inv_image = COALESCE($5, inv_image),
        inv_thumbnail = COALESCE($6, inv_thumbnail),
        inv_price = $7,
        inv_miles = $8,
        inv_color = $9,
        classification_id = $10
      WHERE inv_id = $11
      RETURNING *`;
    const result = await pool.query(sql, [
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
      inv_id
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("updateInventory error: " + error);
    return null;
  }
}



/* ***************************
 *  Delete Inventory Item
 * ************************** */
async function deleteInventoryItem(inv_id) {
  try {
    const sql = 'DELETE FROM inventory WHERE inv_id = $1';
    const data = await pool.query(sql, [inv_id]);
    return data.rowCount;
  } catch (error) {
    console.error("deleteInventoryItem error: " + error);
    return null;
  }
}



/* ***************************
 *  Delete Classification
 * ************************** */
async function deleteClassification(classification_id) {
  try {
    const sql = 'DELETE FROM classification WHERE classification_id = $1';
    const data = await pool.query(sql, [classification_id]);
    return data.rowCount;
  } catch (error) {
    console.error("deleteClassification error: " + error);
    return null;
  }
}



/****************************************
// Create a new order
/****************************************/
async function createOrder(account_id, inv_id) {
  try {
    const vehicleData = await pool.query(
      `SELECT * FROM inventory WHERE inv_id = $1`,
      [inv_id]
    );

    if (vehicleData.rows.length === 0) {
      throw new Error("Vehicle not found.");
    }
    const vehicle = vehicleData.rows[0];

    const sql = `
      INSERT INTO Orders (account_id, inv_id, inv_make, inv_model, inv_year, inv_description, inv_image, inv_price, inv_miles, inv_color, status_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1) -- Default status_id = 1 (Pending)
      RETURNING *`;
    const result = await pool.query(sql, [
      account_id,
      inv_id,
      vehicle.inv_make,
      vehicle.inv_model,
      vehicle.inv_year,
      vehicle.inv_description,
      vehicle.inv_image,
      vehicle.inv_price,
      vehicle.inv_miles,
      vehicle.inv_color,
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("createOrder error: " + error);
    return null;
  }
}



/****************************************
// Fetch orders by account ID
/****************************************/
async function getOrdersByAccountId(account_id) {
  try {
    const sql = `
      SELECT o.*, s.status_name
      FROM Orders o
      JOIN OrderStatus s ON o.status_id = s.status_id
      WHERE o.account_id = $1`;
    const result = await pool.query(sql, [account_id]);
    return result.rows;
  } catch (error) {
    console.error("getOrdersByAccountId error: " + error);
    return null;
  }
}



/****************************************
// Fetch all orders
/****************************************/
async function getAllOrders() {
  try {
    const sql = `
      SELECT o.*, a.account_firstname, a.account_lastname, s.status_name
      FROM Orders o
      JOIN Account a ON o.account_id = a.account_id
      JOIN OrderStatus s ON o.status_id = s.status_id`;
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("getAllOrders error: " + error);
    return null;
  }
}



/****************************************
// Update order status
/****************************************/
async function updateOrderStatus(order_id, status_id, updated_by) {
  try {
    // Update the order status
    const sql = `
      UPDATE Orders
      SET status_id = $1
      WHERE order_id = $2
      RETURNING *`;
    const result = await pool.query(sql, [status_id, order_id]);

    if (result.rows[0]) {
      // Add a record to OrderStatusHistory
      const historySql = `
        INSERT INTO OrderStatusHistory (order_id, status_id, updated_by)
        VALUES ($1, $2, $3)`;
      await pool.query(historySql, [order_id, status_id, updated_by]);
    }

    return result.rows[0];
  } catch (error) {
    console.error("updateOrderStatus error: " + error);
    return null;
  }
}



/****************************************
 * Fetch all order statuses from the OrderStatus table.
 /****************************************/
async function getOrderStatuses() {
  try {
    const sql = `SELECT * FROM OrderStatus`;
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("getOrderStatuses error: " + error);
    return null;
  }
}



/****************************************
// Delete Order
/****************************************/
async function deleteOrder(order_id) {
  try {
    // Delete the order from the Orders table
    const sql = `DELETE FROM Orders WHERE order_id = $1 RETURNING *`;
    const result = await pool.query(sql, [order_id]);

    if (result.rows[0]) {
      console.log("Order deleted successfully:", result.rows[0]);
      return true;
    } else {
      console.log("No order found with ID:", order_id);
      return false;
    }
  } catch (error) {
    console.error("deleteOrder error: " + error);
    return false;
  }
}



/****************************************
// Get order by ID
/****************************************/
async function getOrderById(order_id) {
  try {
    const sql = `
      SELECT o.*, s.status_name
      FROM Orders o
      JOIN OrderStatus s ON o.status_id = s.status_id
      WHERE o.order_id = $1`;
    const result = await pool.query(sql, [order_id]);
    return result.rows[0];
  } catch (error) {
    console.error("getOrderById error: " + error);
    return null;
  }
}



/****************************************
 * Fetch order history for a specific user or all users (for admins).
 /****************************************/
async function getOrderHistory(account_id = null) {
  try {
    let sql = `
      SELECT
        o.order_id,
        o.account_id,
        o.inv_id,
        o.inv_make,
        o.inv_model,
        o.inv_year,
        o.inv_description,
        o.inv_image,
        o.inv_price,
        o.inv_miles,
        o.inv_color,
        o.order_date,
        s.status_name AS current_status,
        h.status_id AS history_status_id,
        sh.status_name AS history_status,
        h.updated_at AS status_change_date,
        a.account_firstname,
        a.account_lastname
      FROM Orders o
      JOIN OrderStatus s ON o.status_id = s.status_id
      LEFT JOIN OrderStatusHistory h ON o.order_id = h.order_id
      LEFT JOIN OrderStatus sh ON h.status_id = sh.status_id
      LEFT JOIN Account a ON h.updated_by = a.account_id`;

    if (account_id) {
      sql += ` WHERE o.account_id = $1`;
    }

    sql += ` ORDER BY o.order_date DESC, h.updated_at DESC`;

    const params = account_id ? [account_id] : [];
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("getOrderHistory error: " + error);
    return null;
  }
}



/****************************************
 * Delete a specific history item.
/****************************************/
async function deleteHistoryItem(history_id) {
  if (!history_id || isNaN(history_id)) {
    return { success: false, message: "Invalid history ID provided" }
  }

  try {
    const sql = `DELETE FROM OrderStatusHistory WHERE history_id = $1 RETURNING order_id`
    const result = await pool.query(sql, [history_id])

    if (result.rowCount > 0) {
      return { success: true, message: "History item deleted successfully" }
    } else {
      return { success: false, message: "History item not found" }
    }
  } catch (error) {
    console.error("deleteHistoryItem error: " + error)
    return { success: false, message: "An error occurred while deleting the history item" }
  }
}



/****************************************
 * Delete all history items for a specific user or
 * all users (for admins), excluding active orders.
/****************************************/
async function deleteAllHistory(account_id = null) {
  try {
    let sql = `
      DELETE FROM OrderStatusHistory
      WHERE order_id IN (
        SELECT o.order_id
        FROM Orders o
        LEFT JOIN Inventory i ON o.inv_id = i.inv_id
        WHERE i.inv_id IS NULL
    `

    if (account_id) {
      sql += ` AND o.account_id = $1`
    }

    sql += `)`

    const params = account_id ? [account_id] : []
    const result = await pool.query(sql, params)

    return {
      success: true,
      message: `${result.rowCount} history items deleted successfully`,
      count: result.rowCount,
    }
  } catch (error) {
    console.error("deleteAllHistory error: " + error)
    return { success: false, message: "An error occurred while deleting history items", count: 0 }
  }
}



module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  addClassification,
  addInventory,
  updateInventory,
  deleteInventoryItem,
  deleteClassification,

  createOrder,
  getOrdersByAccountId,
  getAllOrders,
  updateOrderStatus,
  getOrderStatuses,

  getOrderById,
  deleteOrder,
  getOrderHistory,
  deleteHistoryItem,
  deleteAllHistory
}
