/**
 * Helper module that is both a demonstration and usable implementation of a
 * check character generator and verifier for a GS1 GMN that is used for
 * Regulated Healthcare medical devices that fall under the EU regulations EU
 * MDR 2017/745 and EU IVDR 2017/746, herein referred to as a "healthcare GMN".
 *
 * @author (c) 2019 GS1 AISBL. All rights reserved
 *
 * @namespace HealthcareGMN
 *
 */
var HealthcareGMN = (function () {

    "use strict";

    /**
     * Descending primes used as multipliers of each data character.
     * @private
     */
    var weights =
        [ 83,79,73,71,67,61,59,53,47,43,41,37,31,29,23,19,17,13,11,7,5,3,2 ];

    /**
     * GS1 AI encodable character set 82. Place in the string represents the
     * character value.
     * @private
     */
    var cset82 =
        "!\"%&'()*+,-./0123456789:;<=>?ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
        "_abcdefghijklmnopqrstuvwxyz";

    /**
     * Subset of the encodable character set used for check characters.
     * @private
     */
    var cset32 = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    /**
     * Character to value map for cset82.
     * @private
     */
    var cset82value = {};
    for (var i = 0; i < cset82.length; i++)
        cset82value[ cset82[i] ] = i;

    /**
     * Calculates the two check characters for a given partial healthcare GMN.
     *
     * @memberof HealthcareGMN
     * @param {string} part a partial healthcare GMN.
     * @return {string} two check characters.
     * @throws Will throw error if the format of the given healthcare GMN is invalid.
     */
    var checkCharacters = function (part)
    {
        _formatChecks(part, false);

        /*
         * The GMN check digit calculation is performed here.
         *
         */

        // Characters are compared with the rightmost weights
        var offset = 23 - part.length;

        // Modulo 1021 sum of the products of the character values and their
        // corresponding weights
        var sum = 0;
        for (var i = 0; i < part.length; i++)
        {
                var c = cset82value[ part[i] ];
                var w = weights[ offset + i ];
                sum += c * w;
        }
        sum %= 1021;

        // Split the 10-bit sum over two five-bit check characters
        return "" + cset32[ Math.floor(sum / 32) ] + cset32[ sum % 32 ];
    };

    /**
     * Complete a given partial healthcare GMN by appending two check characters.
     *
     * @memberof HealthcareGMN
     * @param {string} part a partial healthcare GMN.
     * @return {string} a complete healthcare GMN including check characters.
     * @throws Will throw error if the format of the given healthcare GMN is invalid.
     */
    var addCheckCharacters = function (part)
    {
        return part + checkCharacters(part);
    };

    /**
     * Verify that a given healthcare GMN has correct check characters.
     *
     * @memberof HealthcareGMN
     * @param {string} gmn a healthcare GMN.
     * @return {boolean} true if the healthcare GMN is has valid check characters. Otherwise false.
     * @throws Will throw error if the format of the given healthcare GMN is invalid.
     */
    var verifyCheckCharacters = function (gmn)
    {
        _formatChecks(gmn, true);

        // Split off the provided check characters, recalculate them and ensure
        // that they match
        var part = gmn.substring(0, gmn.length - 2);
        var suppliedChecks = gmn.substring(gmn.length - 2, gmn.length);

        return checkCharacters(part) === suppliedChecks;
    };

    // Perform some local consistency checks on the input
    var _formatChecks = function (input, complete) {
        var maxLength = complete ? 25 : 23;
        var minLength = complete ? 8 : 6;

        // Verify length
        if (input.length < minLength)
            throw "The input is too short.";
        if (input.length > maxLength)
            throw "The input is too long.";

        // Ensure that first five digits are numeric
        var i;
        for (i = 0; i < 5; i++)
        {
            if ("0123456789".indexOf( input[i] ) == -1)
                throw "First five characters must be digits.";
        }

        // Verify that the remaining content is in the encodable character set
        for (i = 5; i < input.length; i++)
        {
            if (typeof cset82value[ input[i] ] === "undefined")
                throw "Invalid character at position " + (i + 1) + ": " + input[i];
        }

    };

    return {
        verifyCheckCharacters: verifyCheckCharacters,
        checkCharacters: checkCharacters,
        addCheckCharacters: addCheckCharacters,
    };

})();


// For node.js
try {
   module.exports = exports = HealthcareGMN;
} catch (e) {}

