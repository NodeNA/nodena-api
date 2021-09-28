/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} results
 * @param   {number} statusCode
 */
 export function success(message, results, statusCode) {
  return {
    message,
    error: false,
    code: statusCode,
    results
  };
}

/**
 * @desc    Send any error response
 *
 * @param   {string} message
 * @param   {number} statusCode
 */
export function error(message, statusCode) {
  /**
   * List of common HTTP request code
   * @note  You can add more http request code in here
   */
  const codes = [200, 201, 400, 401, 404, 403, 422, 500];

  // Get matched code
  const findCode = codes.find(code => code == statusCode);

  if (!findCode) statusCode = 500;
  else statusCode = findCode;

  return {
    message,
    code: statusCode,
    error: true
  };
}

/**
 * @desc    Send any validation response
 *
 * @param   {object | array} errors
 */
export function validation(errors) {
  return {
    message: "Validation errors",
    error: true,
    code: 422,
    errors
  };
}
