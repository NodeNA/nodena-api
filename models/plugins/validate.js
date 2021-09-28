import { toString, each, isBoolean, isArray, has, merge } from "lodash";
import validator from "./validator";

import tpl from "@tryghost/tpl";
import { ValidationError } from "@tryghost/errors";

const messages = {
  validationFailed: "Validation ({validationName}) failed for {key}",
  validationFailedTypes: {
    isLength:
      "Value in [{tableName}.{key}] exceeds maximum length of {max} characters.",
  },
};

/**
 * Validate keys using the validator module.
 * Each validation's key is a method name and its value is an array of options
 * eg:
 *       validations: { isURL: true, isLength: [20, 40] }
 * will validate that a values's length is a URL between 20 and 40 chars.
 *
 * If you pass a boolean as the value, it will specify the "good" result. By default
 * the "good" result is assumed to be true.
 * eg:
 *       validations: { isNull: false } // means the "good" result would
 *                                      // fail the `isNull` check, so
 *                                      // not null.
 *
 * available validators: https://github.com/chriso/validator.js#validators
 * @param {String} value the value to validate.
 * @param {String} key the db column key of the value to validate.
 * @param {Object} validations the validations object as described above.
 * @param {String} [tableName] (optional) the db table of the value to validate, used for error message.
 * @return {Array} returns an Array including the found validation errors (empty if none found);
 */
function validate(value, key, validations, tableName) {
  const validationErrors = [];
  let message;
  value = toString(value);

  each(validations, (validationOptions, validationName) => {
    let goodResult = true;

    if (isBoolean(validationOptions)) {
      goodResult = validationOptions;
      validationOptions = [];
    } else if (!isArray(validationOptions)) {
      validationOptions = [validationOptions];
    }

    validationOptions.unshift(value);

    // equivalent of validator.isSomething(option1, option2)
    if (
      validator[validationName].apply(validator, validationOptions) !==
      goodResult
    ) {
      // CASE: You can define specific messages for validators e.g. isLength
      if (has(messages.validationFailedTypes, validationName)) {
        message = tpl(
          messages.validationFailedTypes[validationName],
          merge(
            {
              validationName: validationName,
              key: key,
              tableName: tableName,
            },
            validationOptions[1]
          )
        );
      } else {
        message = tpl(messages.validationFailed, {
          validationName: validationName,
          key: key,
        });
      }

      validationErrors.push(
        new ValidationError({
          message: message,
          context: `${tableName}.${key}`,
        })
      );
    }

    validationOptions.shift();
  });

  return validationErrors;
}

export default validate;
