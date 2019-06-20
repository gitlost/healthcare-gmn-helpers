/**
 * Helper module that is both a demonstration and usable implementation of a
 * check character pair generator and verifier for a GS1 GMN that is used for
 * Regulated Healthcare medical devices that fall under the EU regulations EU
 * MDR 2017/745 and EU IVDR 2017/746, herein referred to as a "healthcare GMN".
 *
 * @author Copyright (c) 2019 GS1 AISBL.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
     * Subset of the encodable character set used for check character pairs.
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
     * Character to value map for cset32.
     * @private
     */
    var cset32value = {};
    for (var i = 0; i < cset32.length; i++)
        cset32value[ cset32[i] ] = i;

    /**
     * Calculates the check character pair for a given partial healthcare GMN.
     *
     * @memberof HealthcareGMN
     * @param {string} part a partial healthcare GMN.
     * @return {string} check character pair.
     * @throws Will throw error if the format of the given healthcare GMN is invalid.
     */
    var checkCharacters = function (part)
    {
        _formatChecks(part, false);

        /*
         * The GMN check character pair calculation is performed here.
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
     * Complete a given partial healthcare GMN by appending the check character pair.
     *
     * @memberof HealthcareGMN
     * @param {string} part a partial healthcare GMN.
     * @return {string} a complete healthcare GMN including the check character pair.
     * @throws Will throw error if the format of the given healthcare GMN is invalid.
     */
    var addCheckCharacters = function (part)
    {
        return part + checkCharacters(part);
    };

    /**
     * Verify that a given healthcare GMN has a correct check character pair.
     *
     * @memberof HealthcareGMN
     * @param {string} gmn a healthcare GMN.
     * @return {boolean} true if the healthcare GMN is has a valid check character pair. Otherwise false.
     * @throws Will throw error if the format of the given healthcare GMN is invalid.
     */
    var verifyCheckCharacters = function (gmn)
    {
        _formatChecks(gmn, true);

        // Split off the provided check character pair, recalculate them and ensure
        // that they match
        var part = gmn.substring(0, gmn.length - 2);
        var suppliedChecks = gmn.substring(gmn.length - 2, gmn.length);

        return checkCharacters(part) === suppliedChecks;
    };

    /**
     * Indicate whether each character in a given GMN belongs to the appropriate character set for the character position.
     *
     * @memberof HealthcareGMN
     * @param {string} gmn a full or partial healthcare GMN.
     * @param {boolean} complete true if a GMN is being provided complete with a check character pair. Otherwise false.
     * @return {boolean[]} a boolean array matching each input character: true if the character belongs to the appropriate set. Otherwise false.
     */
    var goodCharacterPositions = function (gmn, complete)
    {
        var out = [];
        for (var i = 0; i < gmn.length; i++)
        {

            // GMN begins with a GS1 Company Prefix which is at least five characters
            if (i < 5)
                out[i] = "0123456789".indexOf( gmn[i] ) != -1;
            else if (!complete || i < gmn.length - 2)
                out[i] = typeof cset82value[ gmn[i] ] !== "undefined";
            else  // For a complete GMN final two positions are check character pair
                out[i] = typeof cset32value[ gmn[i] ] !== "undefined";

        }
        return out;
    };

    // Perform some local consistency checks on the input
    var _formatChecks = function (input, complete) {
        var maxLength = complete ? 25 : 23;
        var minLength = complete ? 8 : 6;

        // Verify length
        if (input.length < minLength)
            throw "The input is too short. It should be at least " + minLength + " characters long.";
        if (input.length > maxLength)
            throw "The input is too long. It should be " + maxLength + " characters maximum.";

        // Verify that the content is in the correct encodable character set
        var goodCharacters = goodCharacterPositions(input, complete);
        for (var i = 0; i < input.length; i++)
        {

            if (!goodCharacters[i])
            {
                if (i < 5)
                    throw "GMN starts with the GS1 Company Prefix. At least the first five characters must be digits.";
                else if (!complete || i < input.length - 2)
                    throw "Invalid character at position " + (i + 1) + ": " + input[i];
                else
                    throw "Invalid check character at position " + (i + 1) + ": " + input[i];
            }

        }
    };

    return {
        verifyCheckCharacters: verifyCheckCharacters,
        checkCharacters: checkCharacters,
        addCheckCharacters: addCheckCharacters,
        goodCharacterPositions: goodCharacterPositions,
    };

})();


// For node.js
try {
   module.exports = exports = HealthcareGMN;
} catch (e) {}

