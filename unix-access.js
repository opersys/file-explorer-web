'use strict';

var access = require('./_bin/access');

/** Test for existence of file */
var F_OK = 0;
/** Test for execute or search permission */
var X_OK = 1;
/** Test for write permission */
var W_OK = 2;
/** Test for read permission */
var R_OK = 4;

/**
 * Convert permission string into mode value for access() function
 * @param {String} permissions Mixture of 'r', 'w', or 'x' characters. 'r' stands for Read, 'w' fr Write and 'x' for eXecute/search permission.
 *     For example 'rw' converts to R_OK + W_OK.
 * @return {Number} 0 in case of empty string, calculated non-zero value in case of existing 'rwx' characters in the permissions' string.
 */
function modeConvert(permissions) {
    // if no permissions specified, we check for file/directory existence
    var amode = F_OK;

    if (permissions.indexOf('x') >= 0 || permissions.indexOf('X') >= 0)
        amode += X_OK;
    if (permissions.indexOf('w') >= 0 || permissions.indexOf('W') >= 0)
        amode += W_OK;
    if (permissions.indexOf('r') >= 0 || permissions.indexOf('R') >= 0)
        amode += R_OK;

    return amode;
}

/**
 * Verifies argument types and runs either sync or async version of access() depending on presence of callback argument
 * @param {String} path Path to verify access of
 * @param {String} permissions Permissions to verify
 * @param {Function} [callback] Callback to run in case we want to run access() asynchronously
 */
function acc(path, permissions, callback) {
    // argument type checks
    if (typeof path !== 'string')
        throw new TypeError('Path must be of String type');
    if (typeof permissions !== 'string')
        throw new TypeError('Permissions must be of String type');

    var amode = modeConvert(permissions);

    // synchronous call of access()
    if (callback === undefined)
        return access.accessSync(path, amode);
    else
        access.accessAsync(path, amode, callback);

    return undefined;
}

/**
 * Checks whether a path has specific permissions for the user this app is currently running under.
 * @param {String} path Path to a file or directory to check if we have permissions to it
 * @param {String} permissions If empty, file/directory is checked for its existence. To check for specific permissions, add 'r', 'w', or 'x' character.
 *     Any non-valid characters are ignored. If the string contains invalid characters only, it is considered as empty (i.e. check for existence).
 *     Example of permissions: '' checks for existence; 'rw' checks for both read and write permissions; 'x' checks for execute/search permissions; etc.
 * @return {Boolean} True in case the current user has the permissions specified, false otherwise.
 *     False is also returned in case some of the arguments is of invalid type.
 * @throws TypeError in case of an invalid argument type
 */
exports.sync = function(path, permissions) {
    return acc(path, permissions);
}

/**
 * Checks whether a path has specific permissions for the user this app is currently running under.
 * @param {String} path Path to a file or directory to check if we have permissions to it
 * @param {String} permissions If empty, file/directory is checked for its existence. To check for specific permissions, add 'r', 'w', or 'x' character.
 *     Any non-valid characters are ignored. If the string contains invalid characters only, it is considered as empty (i.e. check for existence).
 *     Example of permissions: '' checks for existence; 'rw' checks for both read and write permissions; 'x' checks for execute/search permissions; etc.
 * @param {Function} callback Double-argument callback. First argument with {Object} error, second with {Boolean} result.
 *     Error is set to null in case of successful operation. Result contains either true if the current user has the permissions specified, false otherwise.
 * @throws TypeError in case of an invalid argument type
 */
exports.async = function(path, permissions, callback) {
    if (typeof callback !== 'function')
        throw new TypeError('Callback must be of Function type');

    return acc(path, permissions, callback);
}
