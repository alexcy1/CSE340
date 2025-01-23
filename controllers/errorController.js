const errorController = {}

errorController.triggerError = async (req, res, next) => {
  // Intentionally throw an error
  throw new Error("This is an intentional 500 error")
}

module.exports = errorController

