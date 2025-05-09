// Sources flattened with hardhat v2.22.19 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/access/IAccessControl.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (access/IAccessControl.sol)

pragma solidity ^0.8.0;

/**
 * @dev External interface of AccessControl declared to support ERC165 detection.
 */
interface IAccessControl {
    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted signaling this.
     *
     * _Available since v3.1._
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call, an admin role
     * bearer except when using {AccessControl-_setupRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     */
    function renounceRole(bytes32 role, address account) external;
}


// File @openzeppelin/contracts/utils/Context.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/introspection/IERC165.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[EIP].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/utils/introspection/ERC165.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/introspection/ERC165.sol)

pragma solidity ^0.8.0;

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 *
 * Alternatively, {ERC165Storage} provides an easier to use but more expensive implementation.
 */
abstract contract ERC165 is IERC165 {
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


// File @openzeppelin/contracts/utils/math/Math.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/math/Math.sol)

pragma solidity ^0.8.0;

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library Math {
    enum Rounding {
        Down, // Toward negative infinity
        Up, // Toward infinity
        Zero // Toward zero
    }

    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow.
        return (a & b) + (a ^ b) / 2;
    }

    /**
     * @dev Returns the ceiling of the division of two numbers.
     *
     * This differs from standard division with `/` in that it rounds up instead
     * of rounding down.
     */
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b - 1) / b can overflow on addition, so we distribute.
        return a == 0 ? 0 : (a - 1) / b + 1;
    }

    /**
     * @notice Calculates floor(x * y / denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
     * @dev Original credit to Remco Bloemen under MIT license (https://xn--2-umb.com/21/muldiv)
     * with further edits by Uniswap Labs also under MIT license.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            // 512-bit multiply [prod1 prod0] = x * y. Compute the product mod 2^256 and mod 2^256 - 1, then use
            // use the Chinese Remainder Theorem to reconstruct the 512 bit result. The result is stored in two 256
            // variables such that product = prod1 * 2^256 + prod0.
            uint256 prod0; // Least significant 256 bits of the product
            uint256 prod1; // Most significant 256 bits of the product
            assembly {
                let mm := mulmod(x, y, not(0))
                prod0 := mul(x, y)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }

            // Handle non-overflow cases, 256 by 256 division.
            if (prod1 == 0) {
                // Solidity will revert if denominator == 0, unlike the div opcode on its own.
                // The surrounding unchecked block does not change this fact.
                // See https://docs.soliditylang.org/en/latest/control-structures.html#checked-or-unchecked-arithmetic.
                return prod0 / denominator;
            }

            // Make sure the result is less than 2^256. Also prevents denominator == 0.
            require(denominator > prod1, "Math: mulDiv overflow");

            ///////////////////////////////////////////////
            // 512 by 256 division.
            ///////////////////////////////////////////////

            // Make division exact by subtracting the remainder from [prod1 prod0].
            uint256 remainder;
            assembly {
                // Compute remainder using mulmod.
                remainder := mulmod(x, y, denominator)

                // Subtract 256 bit number from 512 bit number.
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }

            // Factor powers of two out of denominator and compute largest power of two divisor of denominator. Always >= 1.
            // See https://cs.stackexchange.com/q/138556/92363.

            // Does not overflow because the denominator cannot be zero at this stage in the function.
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                // Divide denominator by twos.
                denominator := div(denominator, twos)

                // Divide [prod1 prod0] by twos.
                prod0 := div(prod0, twos)

                // Flip twos such that it is 2^256 / twos. If twos is zero, then it becomes one.
                twos := add(div(sub(0, twos), twos), 1)
            }

            // Shift in bits from prod1 into prod0.
            prod0 |= prod1 * twos;

            // Invert denominator mod 2^256. Now that denominator is an odd number, it has an inverse modulo 2^256 such
            // that denominator * inv = 1 mod 2^256. Compute the inverse by starting with a seed that is correct for
            // four bits. That is, denominator * inv = 1 mod 2^4.
            uint256 inverse = (3 * denominator) ^ 2;

            // Use the Newton-Raphson iteration to improve the precision. Thanks to Hensel's lifting lemma, this also works
            // in modular arithmetic, doubling the correct bits in each step.
            inverse *= 2 - denominator * inverse; // inverse mod 2^8
            inverse *= 2 - denominator * inverse; // inverse mod 2^16
            inverse *= 2 - denominator * inverse; // inverse mod 2^32
            inverse *= 2 - denominator * inverse; // inverse mod 2^64
            inverse *= 2 - denominator * inverse; // inverse mod 2^128
            inverse *= 2 - denominator * inverse; // inverse mod 2^256

            // Because the division is now exact we can divide by multiplying with the modular inverse of denominator.
            // This will give us the correct result modulo 2^256. Since the preconditions guarantee that the outcome is
            // less than 2^256, this is the final result. We don't need to compute the high bits of the result and prod1
            // is no longer required.
            result = prod0 * inverse;
            return result;
        }
    }

    /**
     * @notice Calculates x * y / denominator with full precision, following the selected rounding direction.
     */
    function mulDiv(uint256 x, uint256 y, uint256 denominator, Rounding rounding) internal pure returns (uint256) {
        uint256 result = mulDiv(x, y, denominator);
        if (rounding == Rounding.Up && mulmod(x, y, denominator) > 0) {
            result += 1;
        }
        return result;
    }

    /**
     * @dev Returns the square root of a number. If the number is not a perfect square, the value is rounded down.
     *
     * Inspired by Henry S. Warren, Jr.'s "Hacker's Delight" (Chapter 11).
     */
    function sqrt(uint256 a) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        // For our first guess, we get the biggest power of 2 which is smaller than the square root of the target.
        //
        // We know that the "msb" (most significant bit) of our target number `a` is a power of 2 such that we have
        // `msb(a) <= a < 2*msb(a)`. This value can be written `msb(a)=2**k` with `k=log2(a)`.
        //
        // This can be rewritten `2**log2(a) <= a < 2**(log2(a) + 1)`
        // → `sqrt(2**k) <= sqrt(a) < sqrt(2**(k+1))`
        // → `2**(k/2) <= sqrt(a) < 2**((k+1)/2) <= 2**(k/2 + 1)`
        //
        // Consequently, `2**(log2(a) / 2)` is a good first approximation of `sqrt(a)` with at least 1 correct bit.
        uint256 result = 1 << (log2(a) >> 1);

        // At this point `result` is an estimation with one bit of precision. We know the true value is a uint128,
        // since it is the square root of a uint256. Newton's method converges quadratically (precision doubles at
        // every iteration). We thus need at most 7 iteration to turn our partial result with one bit of precision
        // into the expected uint128 result.
        unchecked {
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            result = (result + a / result) >> 1;
            return min(result, a / result);
        }
    }

    /**
     * @notice Calculates sqrt(a), following the selected rounding direction.
     */
    function sqrt(uint256 a, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = sqrt(a);
            return result + (rounding == Rounding.Up && result * result < a ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 2, rounded down, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) {
                value >>= 128;
                result += 128;
            }
            if (value >> 64 > 0) {
                value >>= 64;
                result += 64;
            }
            if (value >> 32 > 0) {
                value >>= 32;
                result += 32;
            }
            if (value >> 16 > 0) {
                value >>= 16;
                result += 16;
            }
            if (value >> 8 > 0) {
                value >>= 8;
                result += 8;
            }
            if (value >> 4 > 0) {
                value >>= 4;
                result += 4;
            }
            if (value >> 2 > 0) {
                value >>= 2;
                result += 2;
            }
            if (value >> 1 > 0) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 2, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log2(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log2(value);
            return result + (rounding == Rounding.Up && 1 << result < value ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 10, rounded down, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10 ** 64) {
                value /= 10 ** 64;
                result += 64;
            }
            if (value >= 10 ** 32) {
                value /= 10 ** 32;
                result += 32;
            }
            if (value >= 10 ** 16) {
                value /= 10 ** 16;
                result += 16;
            }
            if (value >= 10 ** 8) {
                value /= 10 ** 8;
                result += 8;
            }
            if (value >= 10 ** 4) {
                value /= 10 ** 4;
                result += 4;
            }
            if (value >= 10 ** 2) {
                value /= 10 ** 2;
                result += 2;
            }
            if (value >= 10 ** 1) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 10, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log10(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log10(value);
            return result + (rounding == Rounding.Up && 10 ** result < value ? 1 : 0);
        }
    }

    /**
     * @dev Return the log in base 256, rounded down, of a positive value.
     * Returns 0 if given 0.
     *
     * Adding one to the result gives the number of pairs of hex symbols needed to represent `value` as a hex string.
     */
    function log256(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >> 128 > 0) {
                value >>= 128;
                result += 16;
            }
            if (value >> 64 > 0) {
                value >>= 64;
                result += 8;
            }
            if (value >> 32 > 0) {
                value >>= 32;
                result += 4;
            }
            if (value >> 16 > 0) {
                value >>= 16;
                result += 2;
            }
            if (value >> 8 > 0) {
                result += 1;
            }
        }
        return result;
    }

    /**
     * @dev Return the log in base 256, following the selected rounding direction, of a positive value.
     * Returns 0 if given 0.
     */
    function log256(uint256 value, Rounding rounding) internal pure returns (uint256) {
        unchecked {
            uint256 result = log256(value);
            return result + (rounding == Rounding.Up && 1 << (result << 3) < value ? 1 : 0);
        }
    }
}


// File @openzeppelin/contracts/utils/math/SignedMath.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.0) (utils/math/SignedMath.sol)

pragma solidity ^0.8.0;

/**
 * @dev Standard signed math utilities missing in the Solidity language.
 */
library SignedMath {
    /**
     * @dev Returns the largest of two signed numbers.
     */
    function max(int256 a, int256 b) internal pure returns (int256) {
        return a > b ? a : b;
    }

    /**
     * @dev Returns the smallest of two signed numbers.
     */
    function min(int256 a, int256 b) internal pure returns (int256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two signed numbers without overflow.
     * The result is rounded towards zero.
     */
    function average(int256 a, int256 b) internal pure returns (int256) {
        // Formula from the book "Hacker's Delight"
        int256 x = (a & b) + ((a ^ b) >> 1);
        return x + (int256(uint256(x) >> 255) & (a ^ b));
    }

    /**
     * @dev Returns the absolute unsigned value of a signed value.
     */
    function abs(int256 n) internal pure returns (uint256) {
        unchecked {
            // must be unchecked in order to support `n = type(int256).min`
            return uint256(n >= 0 ? n : -n);
        }
    }
}


// File @openzeppelin/contracts/utils/Strings.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/Strings.sol)

pragma solidity ^0.8.0;


/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant _SYMBOLS = "0123456789abcdef";
    uint8 private constant _ADDRESS_LENGTH = 20;

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), _SYMBOLS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    /**
     * @dev Converts a `int256` to its ASCII `string` decimal representation.
     */
    function toString(int256 value) internal pure returns (string memory) {
        return string(abi.encodePacked(value < 0 ? "-" : "", toString(SignedMath.abs(value))));
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        unchecked {
            return toHexString(value, Math.log256(value) + 1);
        }
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    /**
     * @dev Converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal representation.
     */
    function toHexString(address addr) internal pure returns (string memory) {
        return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
    }

    /**
     * @dev Returns true if the two strings are equal.
     */
    function equal(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}


// File @openzeppelin/contracts/access/AccessControl.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (access/AccessControl.sol)

pragma solidity ^0.8.0;




/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    mapping(bytes32 => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with a standardized message including the required role.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     *
     * _Available since v4.1._
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual override returns (bool) {
        return _roles[role].members[account];
    }

    /**
     * @dev Revert with a standard message if `_msgSender()` is missing `role`.
     * Overriding this function changes the behavior of the {onlyRole} modifier.
     *
     * Format of the revert message is described in {_checkRole}.
     *
     * _Available since v4.6._
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Revert with a standard message if `account` is missing `role`.
     *
     * The format of the revert reason is given by the following regular expression:
     *
     *  /^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert(
                string(
                    abi.encodePacked(
                        "AccessControl: account ",
                        Strings.toHexString(account),
                        " is missing role ",
                        Strings.toHexString(uint256(role), 32)
                    )
                )
            );
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual override returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual override onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual override onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `account`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address account) public virtual override {
        require(account == _msgSender(), "AccessControl: can only renounce roles for self");

        _revokeRole(role, account);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event. Note that unlike {grantRole}, this function doesn't perform any
     * checks on the calling account.
     *
     * May emit a {RoleGranted} event.
     *
     * [WARNING]
     * ====
     * This function should only be called from the constructor when setting
     * up the initial roles for the system.
     *
     * Using this function in any other way is effectively circumventing the admin
     * system imposed by {AccessControl}.
     * ====
     *
     * NOTE: This function is deprecated in favor of {_grantRole}.
     */
    function _setupRole(bytes32 role, address account) internal virtual {
        _grantRole(role, account);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account, _msgSender());
        }
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, _msgSender());
        }
    }
}


// File @openzeppelin/contracts/security/Pausable.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (security/Pausable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File @openzeppelin/contracts/token/ERC721/IERC721.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC721/IERC721.sol)

pragma solidity ^0.8.0;

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface IERC721 is IERC165 {
    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
     */
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
     */
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must have been allowed to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     *
     * WARNING: Note that the caller is responsible to confirm that the recipient is capable of receiving ERC721
     * or else they may be permanently lost. Usage of {safeTransferFrom} prevents loss, though the caller must
     * understand this adds an external call which potentially creates a reentrancy vulnerability.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.
     *
     * Requirements:
     *
     * - The `operator` cannot be the caller.
     *
     * Emits an {ApprovalForAll} event.
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @dev Returns the account approved for `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`.
     *
     * See {setApprovalForAll}
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}


// File @openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/IERC721Metadata.sol)

pragma solidity ^0.8.0;

/**
 * @title ERC-721 Non-Fungible Token Standard, optional metadata extension
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */
interface IERC721Metadata is IERC721 {
    /**
     * @dev Returns the token collection name.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the token collection symbol.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the Uniform Resource Identifier (URI) for `tokenId` token.
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);
}


// File @openzeppelin/contracts/token/ERC721/IERC721Receiver.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC721/IERC721Receiver.sol)

pragma solidity ^0.8.0;

/**
 * @title ERC721 token receiver interface
 * @dev Interface for any contract that wants to support safeTransfers
 * from ERC721 asset contracts.
 */
interface IERC721Receiver {
    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
     *
     * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}


// File @openzeppelin/contracts/utils/Address.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/Address.sol)

pragma solidity ^0.8.1;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     *
     * Furthermore, `isContract` will also return true if the target contract within
     * the same transaction is already scheduled for destruction by `SELFDESTRUCT`,
     * which only has an effect at the end of a transaction.
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.8.0/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and revert (either by bubbling
     * the revert reason or using the provided one) in case of unsuccessful call or if target was not a contract.
     *
     * _Available since v4.8._
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                // only check isContract if the call was successful and the return data is empty
                // otherwise we already know that it was a contract
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason or using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}


// File @openzeppelin/contracts/token/ERC721/ERC721.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC721/ERC721.sol)

pragma solidity ^0.8.0;







/**
 * @dev Implementation of https://eips.ethereum.org/EIPS/eip-721[ERC721] Non-Fungible Token Standard, including
 * the Metadata extension, but not including the Enumerable extension, which is available separately as
 * {ERC721Enumerable}.
 */
contract ERC721 is Context, ERC165, IERC721, IERC721Metadata {
    using Address for address;
    using Strings for uint256;

    // Token name
    string private _name;

    // Token symbol
    string private _symbol;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return _balances[owner];
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }

    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }

    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) public virtual override {
        address owner = ERC721.ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");

        require(
            _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            "ERC721: approve caller is not token owner or approved for all"
        );

        _approve(to, tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        _requireMinted(tokenId);

        return _tokenApprovals[tokenId];
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public virtual override {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");

        _transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * `data` is additional data, it has no specified format and it is sent in call to `to`.
     *
     * This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
     * implement alternative mechanisms to perform token transfer, such as signature-based.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    /**
     * @dev Returns the owner of the `tokenId`. Does NOT revert if token doesn't exist
     */
    function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
        return _owners[tokenId];
    }

    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        address owner = ERC721.ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    /**
     * @dev Safely mints `tokenId` and transfers it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }

    /**
     * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`_safeMint`], with an additional `data` parameter which is
     * forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
     */
    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual {
        _mint(to, tokenId);
        require(
            _checkOnERC721Received(address(0), to, tokenId, data),
            "ERC721: transfer to non ERC721Receiver implementer"
        );
    }

    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     *
     * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - `to` cannot be the zero address.
     *
     * Emits a {Transfer} event.
     */
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        _beforeTokenTransfer(address(0), to, tokenId, 1);

        // Check that tokenId was not minted by `_beforeTokenTransfer` hook
        require(!_exists(tokenId), "ERC721: token already minted");

        unchecked {
            // Will not overflow unless all 2**256 token ids are minted to the same owner.
            // Given that tokens are minted one by one, it is impossible in practice that
            // this ever happens. Might change if we allow batch minting.
            // The ERC fails to describe this case.
            _balances[to] += 1;
        }

        _owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);

        _afterTokenTransfer(address(0), to, tokenId, 1);
    }

    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     * This is an internal function that does not check if the sender is authorized to operate on the token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual {
        address owner = ERC721.ownerOf(tokenId);

        _beforeTokenTransfer(owner, address(0), tokenId, 1);

        // Update ownership in case tokenId was transferred by `_beforeTokenTransfer` hook
        owner = ERC721.ownerOf(tokenId);

        // Clear approvals
        delete _tokenApprovals[tokenId];

        unchecked {
            // Cannot overflow, as that would require more tokens to be burned/transferred
            // out than the owner initially received through minting and transferring in.
            _balances[owner] -= 1;
        }
        delete _owners[tokenId];

        emit Transfer(owner, address(0), tokenId);

        _afterTokenTransfer(owner, address(0), tokenId, 1);
    }

    /**
     * @dev Transfers `tokenId` from `from` to `to`.
     *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     *
     * Emits a {Transfer} event.
     */
    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        _beforeTokenTransfer(from, to, tokenId, 1);

        // Check that tokenId was not transferred by `_beforeTokenTransfer` hook
        require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");

        // Clear approvals from the previous owner
        delete _tokenApprovals[tokenId];

        unchecked {
            // `_balances[from]` cannot overflow for the same reason as described in `_burn`:
            // `from`'s balance is the number of token held, which is at least one before the current
            // transfer.
            // `_balances[to]` could overflow in the conditions described in `_mint`. That would require
            // all 2**256 token ids to be minted, which in practice is impossible.
            _balances[from] -= 1;
            _balances[to] += 1;
        }
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);

        _afterTokenTransfer(from, to, tokenId, 1);
    }

    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits an {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ERC721.ownerOf(tokenId), to, tokenId);
    }

    /**
     * @dev Approve `operator` to operate on all of `owner` tokens
     *
     * Emits an {ApprovalForAll} event.
     */
    function _setApprovalForAll(address owner, address operator, bool approved) internal virtual {
        require(owner != operator, "ERC721: approve to caller");
        _operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    /**
     * @dev Reverts if the `tokenId` has not been minted yet.
     */
    function _requireMinted(uint256 tokenId) internal view virtual {
        require(_exists(tokenId), "ERC721: invalid token ID");
    }

    /**
     * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
     * The call is not executed if the target address is not a contract.
     *
     * @param from address representing the previous owner of the given token ID
     * @param to target address that will receive the tokens
     * @param tokenId uint256 ID of the token to be transferred
     * @param data bytes optional data to send along with the call
     * @return bool whether the call correctly returned the expected magic value
     */
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting and burning. If {ERC721Consecutive} is
     * used, the hook may be called as part of a consecutive (batch) mint, as indicated by `batchSize` greater than 1.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s tokens will be transferred to `to`.
     * - When `from` is zero, the tokens will be minted for `to`.
     * - When `to` is zero, ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     * - `batchSize` is non-zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize) internal virtual {}

    /**
     * @dev Hook that is called after any token transfer. This includes minting and burning. If {ERC721Consecutive} is
     * used, the hook may be called as part of a consecutive (batch) mint, as indicated by `batchSize` greater than 1.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s tokens were transferred to `to`.
     * - When `from` is zero, the tokens were minted for `to`.
     * - When `to` is zero, ``from``'s tokens were burned.
     * - `from` and `to` are never both zero.
     * - `batchSize` is non-zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize) internal virtual {}

    /**
     * @dev Unsafe write access to the balances, used by extensions that "mint" tokens using an {ownerOf} override.
     *
     * WARNING: Anyone calling this MUST ensure that the balances remain consistent with the ownership. The invariant
     * being that for any address `a` the value returned by `balanceOf(a)` must be equal to the number of tokens such
     * that `ownerOf(tokenId)` is `a`.
     */
    // solhint-disable-next-line func-name-mixedcase
    function __unsafe_increaseBalance(address account, uint256 amount) internal {
        _balances[account] += amount;
    }
}


// File @openzeppelin/contracts/security/ReentrancyGuard.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (security/ReentrancyGuard.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}


// File contracts/libraries/AfricycleLibrary.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AfricycleLibrary
 * @dev Internal library for Africycle contract functions
 */
library AfricycleLibrary {
    // Constants
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 150; // 1.5%
    uint256 public constant SCALE = 10000;
    uint256 public constant MAX_BATCH_SIZE = 50;
    uint256 public constant MIN_PROFILE_UPDATE_INTERVAL = 1 days;
    uint256 public constant MAX_ACTIVE_LISTINGS = 20;
    uint256 public constant MIN_REPUTATION_FOR_PROCESSING = 200;
    uint256 public constant MAX_COLLECTION_WEIGHT = 1000;
    uint256 public constant MAX_REPUTATION_SCORE = 1000;

    // Enums
    enum WasteStream {
        PLASTIC,
        EWASTE,
        METAL,
        GENERAL
    }

    enum QualityGrade {
        LOW,
        MEDIUM,
        HIGH,
        PREMIUM
    }

    // Structs
    struct CollectionData {
        uint256 id;
        address collector;
        uint256 weight;
        string location;
        string qrCode;
        string imageHash;
        uint256 timestamp;
        uint256 rewardAmount;
    }

    struct ProcessingData {
        uint256 id;
        address processor;
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 timestamp;
        string processDescription;
        uint256 carbonOffset;
    }

    struct ListingData {
        uint256 id;
        address seller;
        uint256 amount;
        uint256 pricePerUnit;
        uint256 timestamp;
        string description;
        uint256 carbonCredits;
    }

    // Internal functions
    function calculateReward(uint256 weight, uint256 rate) internal pure returns (uint256) {
        return (weight * rate) / 1e18;
    }

    function calculatePlatformFee(uint256 amount) internal pure returns (uint256) {
        return (amount * PLATFORM_FEE_PERCENTAGE) / SCALE;
    }

    function validateCollection(
        uint256 weight,
        string memory location,
        string memory qrCode,
        string memory imageHash
    ) internal pure {
        require(weight > 0, 'Weight must be positive');
        require(weight <= MAX_COLLECTION_WEIGHT, 'Weight exceeds maximum');
        require(bytes(location).length > 0, 'Location required');
        require(bytes(qrCode).length > 0, 'QR code required');
        require(bytes(imageHash).length > 0, 'Image hash required');
    }

    function validateBatchSize(uint256 size) internal pure {
        require(size <= MAX_BATCH_SIZE, 'Batch too large');
    }

    function validateListing(
        uint256 amount,
        uint256 price,
        uint256 activeListings
    ) internal pure {
        require(amount > 0, 'Invalid amount');
        require(price > 0, 'Invalid price');
        require(activeListings < MAX_ACTIVE_LISTINGS, 'Too many active listings');
    }

    function calculateQualityMultiplier(
        WasteStream wasteType,
        QualityGrade quality
    ) internal pure returns (uint256) {
        if (wasteType == WasteStream.PLASTIC) {
            if (quality == QualityGrade.PREMIUM) return 15000;
            if (quality == QualityGrade.HIGH) return 12000;
            if (quality == QualityGrade.MEDIUM) return 10000;
            return 8000;
        } else if (wasteType == WasteStream.EWASTE) {
            if (quality == QualityGrade.PREMIUM) return 18000;
            if (quality == QualityGrade.HIGH) return 15000;
            if (quality == QualityGrade.MEDIUM) return 12000;
            return 9000;
        } else if (wasteType == WasteStream.METAL) {
            if (quality == QualityGrade.PREMIUM) return 16000;
            if (quality == QualityGrade.HIGH) return 13000;
            if (quality == QualityGrade.MEDIUM) return 11000;
            return 8500;
        } else {
            if (quality == QualityGrade.PREMIUM) return 14000;
            if (quality == QualityGrade.HIGH) return 11000;
            if (quality == QualityGrade.MEDIUM) return 9000;
            return 7500;
        }
    }

    function calculateReputationIncrease(
        uint256 baseIncrease,
        QualityGrade quality
    ) internal pure returns (uint256) {
        if (quality == QualityGrade.PREMIUM) return baseIncrease * 2;
        if (quality == QualityGrade.HIGH) return baseIncrease * 3/2;
        if (quality == QualityGrade.MEDIUM) return baseIncrease;
        return baseIncrease / 2;
    }

    function calculateCarbonOffset(
        WasteStream wasteType,
        uint256 amount,
        QualityGrade quality
    ) internal pure returns (uint256) {
        uint256 baseOffset;
        if (wasteType == WasteStream.PLASTIC) baseOffset = 2;
        else if (wasteType == WasteStream.EWASTE) baseOffset = 5;
        else if (wasteType == WasteStream.METAL) baseOffset = 3;
        else baseOffset = 1;

        uint256 qualityMultiplier;
        if (quality == QualityGrade.PREMIUM) qualityMultiplier = 15000;
        else if (quality == QualityGrade.HIGH) qualityMultiplier = 12000;
        else if (quality == QualityGrade.MEDIUM) qualityMultiplier = 10000;
        else qualityMultiplier = 8000;

        return (amount * baseOffset * qualityMultiplier) / 10000;
    }

    function validateListingPrice(
        uint256 price,
        WasteStream wasteType,
        QualityGrade quality
    ) internal pure {
        require(price > 0, "Price must be positive");
        
        uint256 minPrice;
        if (wasteType == WasteStream.PLASTIC) minPrice = 0.1 ether;
        else if (wasteType == WasteStream.EWASTE) minPrice = 0.5 ether;
        else if (wasteType == WasteStream.METAL) minPrice = 0.3 ether;
        else minPrice = 0.05 ether;

        if (quality == QualityGrade.PREMIUM) minPrice = minPrice * 2;
        else if (quality == QualityGrade.HIGH) minPrice = minPrice * 3/2;
        
        require(price >= minPrice, "Price too low");
    }

    function calculateListingFee(
        uint256 totalPrice,
        uint256 carbonCredits
    ) internal pure returns (uint256) {
        uint256 baseFee = (totalPrice * PLATFORM_FEE_PERCENTAGE) / SCALE;
        if (carbonCredits > 0) {
            baseFee = (baseFee * 90) / 100;
        }
        return baseFee;
    }

    // Batch Processing Functions
    function validateBatchCollections(
        uint256[] memory collectionIds,
        WasteStream expectedType
    ) internal pure {
        require(collectionIds.length > 0, "No collections");
        require(collectionIds.length <= MAX_BATCH_SIZE, "Batch too large");
    }

    function calculateBatchOutput(
        uint256 totalInput,
        WasteStream wasteType,
        QualityGrade quality
    ) internal pure returns (uint256) {
        uint256 efficiency;
        if (wasteType == WasteStream.PLASTIC) efficiency = 90;
        else if (wasteType == WasteStream.EWASTE) efficiency = 85;
        else if (wasteType == WasteStream.METAL) efficiency = 95;
        else efficiency = 80; // GENERAL

        uint256 qualityMultiplier;
        if (quality == QualityGrade.PREMIUM) qualityMultiplier = 11000;
        else if (quality == QualityGrade.HIGH) qualityMultiplier = 10500;
        else if (quality == QualityGrade.MEDIUM) qualityMultiplier = 10000;
        else qualityMultiplier = 9500;

        return (totalInput * efficiency * qualityMultiplier) / (100 * 10000);
    }

    // Verification Functions
    function validateVerificationThreshold(
        uint256 amount,
        WasteStream wasteType,
        uint256 threshold
    ) internal pure {
        require(amount >= threshold, "Amount below threshold");
        if (wasteType == WasteStream.EWASTE) {
            require(amount >= threshold * 2, "E-waste requires higher threshold");
        }
    }

    function calculateVerificationScore(
        QualityGrade quality,
        uint256 amount,
        string memory proof
    ) internal pure returns (uint256) {
        uint256 baseScore = 100;
        
        if (quality == QualityGrade.PREMIUM) baseScore *= 2;
        else if (quality == QualityGrade.HIGH) baseScore = (baseScore * 3) / 2;
        
        uint256 amountMultiplier = amount / 100;
        if (amountMultiplier > 2) amountMultiplier = 2;
        
        uint256 proofBonus = bytes(proof).length > 0 ? 50 : 0;
        
        return baseScore + (baseScore * amountMultiplier) + proofBonus;
    }
}


// File contracts/Africycle.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;






/**
 * @title AfriCycle
 * @dev A comprehensive waste management ecosystem on the blockchain
 *
 * This contract implements a full waste management system including:
 * - Multi-stream waste collection (Plastic, E-Waste, Metal, General)
 * - E-waste component tracking
 * - Processing and recycling operations
 * - Marketplace for recycled materials
 * - Impact credit system
 * - Reputation and reward mechanisms
 *
 * Key Features:
 * - Role-based access control for different stakeholders
 * - Quality-based reward system
 * - Carbon offset tracking
 * - Transparent verification process
 * - Marketplace for trading processed materials
 * - Impact credit system for environmental contributions
 *
 * @notice This contract uses cUSD (Celo Dollar) as the primary token for transactions
 */
contract AfriCycle is AccessControl, ReentrancyGuard, Pausable {
    using AfricycleLibrary for *;

    // ============ Custom Errors ============
    error InvalidWasteStream();

    // ============ Role Definitions ============
    bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
    bytes32 public constant COLLECTOR_ROLE = keccak256('COLLECTOR_ROLE');
    bytes32 public constant COLLECTION_POINT_ROLE = keccak256('COLLECTION_POINT_ROLE');
    bytes32 public constant RECYCLER_ROLE = keccak256('RECYCLER_ROLE');
    bytes32 public constant CORPORATE_ROLE = keccak256('CORPORATE_ROLE');
    bytes32 public constant VERIFIER_ROLE = keccak256('VERIFIER_ROLE');

    // ============ Enums ============
    enum Status {
        PENDING,
        VERIFIED,
        REJECTED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    enum EWasteComponent {
        CPU,
        BATTERY,
        PCB,
        OTHER
    }

    // ============ Structs ============
    struct UserProfile {
        string name;
        string location;
        string contactInfo;
        Status status;
        uint256 registrationDate;
        uint256 verificationDate;
        uint256 reputationScore;
        bool isVerified;
        mapping(AfricycleLibrary.WasteStream => uint256) totalCollected;
        mapping(AfricycleLibrary.WasteStream => uint256) totalProcessed;
        uint256 totalEarnings;
    }

    struct WasteCollection {
        uint256 id;
        address collector;
        AfricycleLibrary.WasteStream wasteType;
        uint256 weight;
        string location;
        string qrCode;
        string imageHash;
        Status status;
        uint256 timestamp;
        AfricycleLibrary.QualityGrade quality;
        uint256 rewardAmount;
        bool isProcessed;
    }

    struct EWasteDetails {
        uint256 collectionId;
        mapping(EWasteComponent => uint256) components;
        string serialNumber;
        string manufacturer;
        uint256 estimatedValue;
    }

    struct ProcessingBatch {
        uint256 id;
        uint256[] collectionIds;
        address processor;
        AfricycleLibrary.WasteStream wasteType;
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 timestamp;
        Status status;
        string processDescription;
        AfricycleLibrary.QualityGrade outputQuality;
        uint256 carbonOffset;
    }

    struct MarketplaceListing {
        uint256 id;
        address seller;
        AfricycleLibrary.WasteStream wasteType;
        uint256 amount;
        uint256 pricePerUnit;
        AfricycleLibrary.QualityGrade quality;
        bool isActive;
        uint256 timestamp;
        string description;
        uint256 carbonCredits;
    }

    struct ImpactCredit {
        uint256 id;
        address owner;
        AfricycleLibrary.WasteStream wasteType;
        uint256 amount;
        uint256 carbonOffset;
        uint256 timestamp;
        string verificationProof;
    }

    struct UserStats {
        uint256[4] collected;
        uint256[4] processed;
        uint256 totalEarnings;
        uint256 reputationScore;
        uint256 activeListings;
        bool verifiedStatus;
        bool suspendedStatus;
        bool blacklistedStatus;
    }

    // ============ State Variables ============

    /// @notice Celo Dollar token contract
    IERC20 public cUSDToken;

    /// @notice Collection ID counter
    uint256 private _collectionIdCounter;

    /// @notice Processing ID counter
    uint256 private _processingIdCounter;

    /// @notice Listing ID counter
    uint256 private _listingIdCounter;

    /// @notice Impact credit ID counter
    uint256 private _impactCreditIdCounter;

    // ============ Mappings ============

    /// @notice User profiles mapping
    mapping(address => UserProfile) public userProfiles;

    /// @notice Waste collections mapping
    mapping(uint256 => WasteCollection) public collections;

    /// @notice E-waste details mapping
    mapping(uint256 => EWasteDetails) public eWasteDetails;

    /// @notice Processing batches mapping
    mapping(uint256 => ProcessingBatch) public processingBatches;

    /// @notice Marketplace listings mapping
    mapping(uint256 => MarketplaceListing) public listings;

    /// @notice Impact credits mapping
    mapping(uint256 => ImpactCredit) public impactCredits;

    /// @notice Reward rates by waste type
    mapping(AfricycleLibrary.WasteStream => uint256) public rewardRates;

    /// @notice Total processed waste by type
    mapping(AfricycleLibrary.WasteStream => uint256) public totalProcessed;

    /// @notice Quality multipliers by waste type and grade
    mapping(AfricycleLibrary.WasteStream => mapping(AfricycleLibrary.QualityGrade => uint256))
        public qualityMultipliers;

    // ============ Additional Security Features ============

    /**
     * @notice Minimum time between profile updates (in seconds)
     * @dev Prevents spam updates
     */
    uint256 public constant MIN_PROFILE_UPDATE_INTERVAL = 1 days;

    /**
     * @notice Maximum number of active listings per user
     * @dev Prevents market manipulation
     */
    uint256 public constant MAX_ACTIVE_LISTINGS = 20;

    /**
     * @notice Minimum reputation score required for certain operations
     * @dev Prevents abuse by new/low-reputation users
     */
    uint256 public constant MIN_REPUTATION_FOR_PROCESSING = 200;

    /**
     * @notice Maximum weight per collection (in kg)
     * @dev Prevents unrealistic collection amounts
     */
    uint256 public constant MAX_COLLECTION_WEIGHT = 1000;

    // ============ Additional State Variables ============

    /**
     * @notice Last profile update timestamp per user
     */
    mapping(address => uint256) public lastProfileUpdate;

    /**
     * @notice Number of active listings per user
     */
    mapping(address => uint256) public userActiveListings;

    /**
     * @notice Blacklisted addresses
     */
    mapping(address => bool) public isBlacklisted;

    /**
     * @notice Suspended users
     */
    mapping(address => bool) public isSuspended;

    /**
     * @notice Collection verification thresholds
     */
    mapping(AfricycleLibrary.WasteStream => uint256) public verificationThresholds;

    // ============ Events ============

    event UserRegistered(address indexed user, string name, string location);
    event UserVerified(address indexed user);
    event UserRoleGranted(address indexed user, bytes32 indexed role);
    event UserRoleRevoked(address indexed user, bytes32 indexed role);
    event UserProfileUpdated(address indexed user, string name, string location);
    event UserReputationUpdated(address indexed user, uint256 newScore);

    event CollectionCreated(
        uint256 indexed collectionId,
        address indexed collector,
        uint256 weight,
        AfricycleLibrary.WasteStream wasteType
    );
    event CollectionVerified(
        uint256 indexed id,
        address indexed verifier,
        AfricycleLibrary.QualityGrade quality,
        uint256 rewardAmount
    );
    event CollectionRejected(
        uint256 indexed id,
        address indexed verifier,
        string reason
    );
    event CollectionUpdated(uint256 indexed id, uint256 weight, string location);

    event EWasteDetailsAdded(
        uint256 indexed collectionId,
        uint256[] componentCounts,
        string serialNumber,
        string manufacturer,
        uint256 estimatedValue
    );
    event EWasteComponentUpdated(
        uint256 indexed collectionId,
        EWasteComponent component,
        uint256 count
    );

    event ProcessingBatchCreated(
        uint256 indexed id,
        address indexed processor,
        AfricycleLibrary.WasteStream wasteType,
        uint256[] collectionIds,
        uint256 totalInput
    );
    event ProcessingBatchUpdated(
        uint256 indexed id,
        uint256 outputAmount,
        AfricycleLibrary.QualityGrade quality
    );
    event ProcessingCompleted(
        uint256 indexed id,
        uint256 outputAmount,
        uint256 carbonOffset,
        AfricycleLibrary.QualityGrade quality
    );
    event ProcessingRejected(uint256 indexed id, string reason);

    event ListingCreated(
        uint256 indexed id,
        address indexed seller,
        AfricycleLibrary.WasteStream wasteType,
        uint256 amount,
        uint256 pricePerUnit,
        AfricycleLibrary.QualityGrade quality,
        uint256 carbonCredits
    );
    event ListingUpdated(
        uint256 indexed id,
        uint256 newAmount,
        uint256 newPrice,
        bool isActive
    );
    event ListingPurchased(
        uint256 indexed id,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice,
        uint256 platformFee
    );
    event ListingCancelled(uint256 indexed id, address indexed seller);

    event ImpactCreditMinted(
        uint256 indexed id,
        address indexed owner,
        AfricycleLibrary.WasteStream wasteType,
        uint256 amount,
        uint256 carbonOffset
    );
    event ImpactCreditTransferred(
        uint256 indexed id,
        address indexed from,
        address indexed to
    );
    event ImpactCreditBurned(uint256 indexed id, address indexed owner);
    event ImpactCreditVerified(
        uint256 indexed id,
        address indexed verifier,
        string verificationProof
    );

    event RewardPaid(
        address indexed recipient,
        uint256 amount,
        AfricycleLibrary.WasteStream wasteType,
        uint256 collectionId
    );
    event PlatformFeePaid(
        address indexed from,
        uint256 amount,
        uint256 indexed listingId
    );
    event PlatformFeeWithdrawn(address indexed admin, uint256 amount);

    event RewardRateUpdated(AfricycleLibrary.WasteStream wasteType, uint256 newRate);
    event QualityMultiplierUpdated(
        AfricycleLibrary.WasteStream wasteType,
        AfricycleLibrary.QualityGrade quality,
        uint256 multiplier
    );
    event ContractPaused(address indexed admin);
    event ContractUnpaused(address indexed admin);
    event EmergencyWithdrawal(
        address indexed admin,
        address token,
        uint256 amount
    );

    event OperationFailed(
        bytes32 indexed operation,
        string reason,
        uint256 timestamp
    );
    event SecurityIncident(
        address indexed account,
        string description,
        uint256 timestamp
    );

    event UserSuspended(address indexed user, string reason);
    event UserUnsuspended(address indexed user);
    event UserBlacklisted(address indexed user, string reason);
    event UserRemovedFromBlacklist(address indexed user);
    event VerificationThresholdUpdated(
        AfricycleLibrary.WasteStream wasteType,
        uint256 newThreshold
    );
    event BatchOperationCompleted(
        bytes32 indexed operation,
        uint256 itemsProcessed
    );

    // ============ Constructor ============

    /**
     * @notice Initializes the AfriCycle contract
     * @param _cUSDToken Address of the cUSD token contract
     */
    constructor(address _cUSDToken) {
        cUSDToken = IERC20(_cUSDToken);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);

        // Initialize default reward rates (in cUSD, scaled by 1e18)
        rewardRates[AfricycleLibrary.WasteStream.PLASTIC] = 0.5 ether; // 0.5 cUSD per kg
        rewardRates[AfricycleLibrary.WasteStream.EWASTE] = 2 ether; // 2 cUSD per kg
        rewardRates[AfricycleLibrary.WasteStream.METAL] = 1 ether; // 1 cUSD per kg
        rewardRates[AfricycleLibrary.WasteStream.GENERAL] = 0.2 ether; // 0.2 cUSD per kg

        // Initialize quality multipliers (percentage, base 10000)
        qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][AfricycleLibrary.QualityGrade.LOW] = 8000; // 80%
        qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][AfricycleLibrary.QualityGrade.MEDIUM] = 10000; // 100%
        qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][AfricycleLibrary.QualityGrade.HIGH] = 12000; // 120%
        qualityMultipliers[AfricycleLibrary.WasteStream.PLASTIC][AfricycleLibrary.QualityGrade.PREMIUM] = 15000; // 150%
    }

    // ============ Modifiers ============

    /// @notice Restricts function access to admin role
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), 'Caller is not an admin');
        _;
    }

    /// @notice Restricts function access to verifier role
    modifier onlyVerifier() {
        require(hasRole(VERIFIER_ROLE, msg.sender), 'Caller is not a verifier');
        _;
    }

    /// @notice Restricts function access to collector role
    modifier onlyCollector() {
        require(hasRole(COLLECTOR_ROLE, msg.sender), 'Caller is not a collector');
        _;
    }

    /// @notice Restricts function access to recycler role
    modifier onlyRecycler() {
        require(hasRole(RECYCLER_ROLE, msg.sender), 'Caller is not a recycler');
        _;
    }

    /// @notice Restricts function access to corporate role
    modifier onlyCorporate() {
        require(hasRole(CORPORATE_ROLE, msg.sender), 'Caller is not a corporate partner');
        _;
    }

    /// @notice Restricts function access to collection point role
    modifier onlyCollectionPoint() {
        require(hasRole(COLLECTION_POINT_ROLE, msg.sender), 'Caller is not a collection point');
        _;
    }

    /// @notice Ensures user is not blacklisted
    modifier notBlacklisted() {
        require(!isBlacklisted[msg.sender], 'User is blacklisted');
        _;
    }

    /// @notice Ensures user is not suspended
    modifier notSuspended() {
        require(!isSuspended[msg.sender], 'User is suspended');
        _;
    }

    /// @notice Ensures sufficient time has passed since last profile update
    modifier canUpdateProfile() {
        require(
            block.timestamp >=
                lastProfileUpdate[msg.sender] + MIN_PROFILE_UPDATE_INTERVAL,
            'Too soon to update profile'
        );
        _;
    }

    // ============ User Management Functions ============

    /**
     * @notice Registers a new user in the system
     * @param _name User's name
     * @param _location User's location
     * @param _contactInfo User's contact information
     * @dev Initializes user profile with default values
     */
    function registerUser(
        string memory _name,
        string memory _location,
        string memory _contactInfo
    ) external whenNotPaused {
        require(bytes(_name).length > 0, 'Name required');
        require(bytes(_location).length > 0, 'Location required');
        require(
            userProfiles[msg.sender].registrationDate == 0,
            'Already registered'
        );

        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.location = _location;
        profile.contactInfo = _contactInfo;
        profile.status = Status.PENDING;
        profile.registrationDate = block.timestamp;
        profile.reputationScore = 100; // Initial reputation score

        emit UserRegistered(msg.sender, _name, _location);
    }

    function verifyUser(address _user) external onlyVerifier whenNotPaused {
        UserProfile storage profile = userProfiles[_user];
        require(profile.registrationDate > 0, 'User not registered');
        require(!profile.isVerified, 'Already verified');

        profile.isVerified = true;
        profile.status = Status.VERIFIED;
        profile.verificationDate = block.timestamp;

        emit UserVerified(_user);
    }

    // ============ Collection Functions ============

    function createCollection(
        AfricycleLibrary.WasteStream _wasteType,
        uint256 _weight,
        string memory _location,
        string memory _qrCode,
        string memory _imageHash
    ) public onlyCollector whenNotPaused returns (uint256) {
        AfricycleLibrary.validateCollection(_weight, _location, _qrCode, _imageHash);

        uint256 collectionId = _collectionIdCounter++;
        uint256 rewardAmount = AfricycleLibrary.calculateReward(_weight, rewardRates[_wasteType]);

        collections[collectionId] = WasteCollection({
            id: collectionId,
            collector: msg.sender,
            wasteType: _wasteType,
            weight: _weight,
            location: _location,
            qrCode: _qrCode,
            imageHash: _imageHash,
            status: Status.PENDING,
            timestamp: block.timestamp,
            quality: AfricycleLibrary.QualityGrade.LOW,
            rewardAmount: rewardAmount,
            isProcessed: false
        });

        UserProfile storage profile = userProfiles[msg.sender];
        profile.totalCollected[_wasteType] += _weight;

        emit CollectionCreated(collectionId, msg.sender, _weight, _wasteType);
        return collectionId;
    }

    function batchCreateCollections(
        AfricycleLibrary.WasteStream[] memory _wasteTypes,
        uint256[] memory _weights,
        string[] memory _locations,
        string[] memory _qrCodes,
        string[] memory _imageHashes
    ) external onlyCollector whenNotPaused returns (uint256[] memory) {
        require(
            _wasteTypes.length == _weights.length &&
            _weights.length == _locations.length &&
            _locations.length == _qrCodes.length &&
            _qrCodes.length == _imageHashes.length,
            'Length mismatch'
        );
        require(_wasteTypes.length <= AfricycleLibrary.MAX_BATCH_SIZE, 'Batch too large');

        uint256[] memory collectionIds = new uint256[](_wasteTypes.length);

        for (uint256 i = 0; i < _wasteTypes.length; i++) {
            collectionIds[i] = createCollection(
                _wasteTypes[i],
                _weights[i],
                _locations[i],
                _qrCodes[i],
                _imageHashes[i]
            );
        }

        emit BatchOperationCompleted(keccak256('CREATE_COLLECTIONS'), _wasteTypes.length);
        return collectionIds;
    }

    function addEWasteDetails(
        uint256 _collectionId,
        uint256[] memory _componentCounts,
        string memory _serialNumber,
        string memory _manufacturer,
        uint256 _estimatedValue
    ) external onlyCollector whenNotPaused {
        require(
            collections[_collectionId].wasteType == AfricycleLibrary.WasteStream.EWASTE,
            'Not e-waste'
        );
        require(
            collections[_collectionId].collector == msg.sender,
            'Not collector'
        );
        require(_componentCounts.length == 4, 'Invalid component count'); // CPU, BATTERY, PCB, OTHER

        EWasteDetails storage details = eWasteDetails[_collectionId];
        details.collectionId = _collectionId;
        details.serialNumber = _serialNumber;
        details.manufacturer = _manufacturer;
        details.estimatedValue = _estimatedValue;

        for (uint i = 0; i < _componentCounts.length; i++) {
            details.components[EWasteComponent(i)] = _componentCounts[i];
        }

        emit EWasteDetailsAdded(
            _collectionId,
            _componentCounts,
            _serialNumber,
            _manufacturer,
            _estimatedValue
        );
    }

    function verifyCollection(
        uint256 _collectionId,
        AfricycleLibrary.QualityGrade _quality
    ) external onlyVerifier whenNotPaused {
        WasteCollection storage collection = collections[_collectionId];
        require(collection.status == Status.PENDING, 'Not pending');

        collection.status = Status.VERIFIED;
        collection.quality = _quality;

        // Use library calculation for quality multiplier
        uint256 qualityMultiplier = AfricycleLibrary.calculateQualityMultiplier(
            collection.wasteType,
            _quality
        );
        collection.rewardAmount = (collection.rewardAmount * qualityMultiplier) / AfricycleLibrary.SCALE;

        // Pay reward
        require(
            cUSDToken.transfer(collection.collector, collection.rewardAmount),
            'Reward transfer failed'
        );

        // Update collector stats
        UserProfile storage collector = userProfiles[collection.collector];
        collector.totalCollected[collection.wasteType] += collection.weight;
        collector.totalEarnings += collection.rewardAmount;
        collector.reputationScore += AfricycleLibrary.calculateReputationIncrease(
            1, // base increase
            _quality
        );

        emit CollectionVerified(_collectionId, msg.sender, _quality, collection.rewardAmount);
        emit RewardPaid(collection.collector, collection.rewardAmount, collection.wasteType, _collectionId);
    }

    function updateCollection(
        uint256 _collectionId,
        uint256 _newWeight,
        string memory _newLocation
    ) external onlyCollector whenNotPaused {
        WasteCollection storage collection = collections[_collectionId];
        require(collection.collector == msg.sender, 'Not collector');
        require(collection.status == Status.PENDING, 'Not pending');
        require(_newWeight > 0, 'Invalid weight');
        require(bytes(_newLocation).length > 0, 'Location required');

        collection.weight = _newWeight;
        collection.location = _newLocation;
        collection.rewardAmount =
            (collection.weight * rewardRates[collection.wasteType]) /
            1e18;

        emit CollectionUpdated(_collectionId, _newWeight, _newLocation);
    }

    function rejectCollection(
        uint256 _collectionId,
        string memory _reason
    ) external onlyVerifier whenNotPaused {
        WasteCollection storage collection = collections[_collectionId];
        require(collection.id == _collectionId, 'Collection does not exist');
        require(collection.status == Status.PENDING, 'Not pending');

        collection.status = Status.REJECTED;
        emit CollectionRejected(_collectionId, msg.sender, _reason);
    }

    // ============ Processing Functions ============

    function createProcessingBatch(
        uint256[] memory _collectionIds,
        string memory _processDescription
    ) external onlyRecycler whenNotPaused {
        require(_collectionIds.length > 0, 'No collections');

        uint256 batchId = _processingIdCounter++;
        AfricycleLibrary.WasteStream wasteType = collections[_collectionIds[0]].wasteType;
        uint256 totalInput = 0;

        // Verify all collections are of same type and verified
        for (uint i = 0; i < _collectionIds.length; i++) {
            WasteCollection storage collection = collections[_collectionIds[i]];
            require(collection.status == Status.VERIFIED, 'Collection not verified');
            require(!collection.isProcessed, 'Already processed');
            require(collection.wasteType == wasteType, 'Mixed waste types');

            collection.isProcessed = true;
            totalInput += collection.weight;
        }

        ProcessingBatch storage batch = processingBatches[batchId];
        batch.id = batchId;
        batch.collectionIds = _collectionIds;
        batch.processor = msg.sender;
        batch.wasteType = wasteType;
        batch.inputAmount = totalInput;
        batch.timestamp = block.timestamp;
        batch.status = Status.IN_PROGRESS;
        batch.processDescription = _processDescription;

        emit ProcessingBatchCreated(
            batchId,
            msg.sender,
            wasteType,
            _collectionIds,
            totalInput
        );
    }

    function completeProcessing(
        uint256 _batchId,
        uint256 _outputAmount,
        AfricycleLibrary.QualityGrade _outputQuality,
        uint256 _carbonOffset
    ) external onlyRecycler whenNotPaused {
        ProcessingBatch storage batch = processingBatches[_batchId];
        require(batch.processor == msg.sender, 'Not processor');
        require(batch.status == Status.IN_PROGRESS, 'Not in progress');
        require(_outputAmount <= batch.inputAmount, 'Invalid output amount');

        batch.outputAmount = _outputAmount;
        batch.outputQuality = _outputQuality;
        batch.carbonOffset = AfricycleLibrary.calculateCarbonOffset(
            batch.wasteType,
            _outputAmount,
            _outputQuality
        );
        batch.status = Status.COMPLETED;

        // Update processor stats
        UserProfile storage processor = userProfiles[msg.sender];
        processor.totalProcessed[batch.wasteType] += _outputAmount;
        processor.reputationScore += AfricycleLibrary.calculateReputationIncrease(
            2, // base increase
            _outputQuality
        );

        // Update global stats
        totalProcessed[batch.wasteType] += _outputAmount;

        // Create impact credit
        uint256 creditId = _impactCreditIdCounter++;
        impactCredits[creditId] = ImpactCredit({
            id: creditId,
            owner: msg.sender,
            wasteType: batch.wasteType,
            amount: _outputAmount,
            carbonOffset: batch.carbonOffset,
            timestamp: block.timestamp,
            verificationProof: ''
        });

        emit ProcessingCompleted(_batchId, _outputAmount, batch.carbonOffset, _outputQuality);
        emit ImpactCreditMinted(
            creditId,
            msg.sender,
            batch.wasteType,
            _outputAmount,
            batch.carbonOffset
        );
    }

    // ============ Marketplace Functions ============

    function createListing(
        AfricycleLibrary.WasteStream _wasteType,
        uint256 _amount,
        uint256 _pricePerUnit,
        AfricycleLibrary.QualityGrade _quality,
        string memory _description,
        uint256 _carbonCredits
    ) external onlyRecycler whenNotPaused notSuspended notBlacklisted {
        require(_amount > 0, 'Amount required');
        AfricycleLibrary.validateListingPrice(_pricePerUnit, _wasteType, _quality);
        require(
            userActiveListings[msg.sender] < AfricycleLibrary.MAX_ACTIVE_LISTINGS,
            'Too many active listings'
        );

        uint256 listingId = _listingIdCounter++;

        listings[listingId] = MarketplaceListing({
            id: listingId,
            seller: msg.sender,
            wasteType: _wasteType,
            amount: _amount,
            pricePerUnit: _pricePerUnit,
            quality: _quality,
            isActive: true,
            timestamp: block.timestamp,
            description: _description,
            carbonCredits: _carbonCredits
        });

        userActiveListings[msg.sender]++;

        emit ListingCreated(
            listingId,
            msg.sender,
            _wasteType,
            _amount,
            _pricePerUnit,
            _quality,
            _carbonCredits
        );
    }

    function purchaseListing(
        uint256 _listingId,
        uint256 _amount
    ) external whenNotPaused nonReentrant {
        MarketplaceListing storage listing = listings[_listingId];
        require(listing.isActive, 'Listing not active');
        require(_amount <= listing.amount, 'Insufficient amount');

        uint256 totalPrice = _amount * listing.pricePerUnit;
        uint256 platformFee = AfricycleLibrary.calculateListingFee(totalPrice, listing.carbonCredits);
        uint256 sellerAmount = totalPrice - platformFee;

        // Transfer payment
        require(
            cUSDToken.transferFrom(msg.sender, address(this), platformFee),
            'Platform fee transfer failed'
        );
        require(
            cUSDToken.transferFrom(msg.sender, listing.seller, sellerAmount),
            'Payment transfer failed'
        );

        // Update listing
        listing.amount -= _amount;
        if (listing.amount == 0) {
            listing.isActive = false;
            userActiveListings[listing.seller]--;
        }

        emit ListingPurchased(_listingId, msg.sender, _amount, totalPrice, platformFee);
    }

    // ============ Admin Functions ============

    function setRewardRate(
        AfricycleLibrary.WasteStream _wasteType,
        uint256 _rate
    ) external onlyAdmin {
        rewardRates[_wasteType] = _rate;
        emit RewardRateUpdated(_wasteType, _rate);
    }

    function setQualityMultiplier(
        AfricycleLibrary.WasteStream _wasteType,
        AfricycleLibrary.QualityGrade _quality,
        uint256 _multiplier
    ) external onlyAdmin {
        require(_multiplier <= 20000, 'Multiplier too high'); // Max 200%
        qualityMultipliers[_wasteType][_quality] = _multiplier;
        emit QualityMultiplierUpdated(_wasteType, _quality, _multiplier);
    }

    function withdrawPlatformFees() external onlyAdmin {
        uint256 balance = cUSDToken.balanceOf(address(this));
        require(balance > 0, 'No fees to withdraw');
        require(cUSDToken.transfer(msg.sender, balance), 'Fee withdrawal failed');
        emit PlatformFeeWithdrawn(msg.sender, balance);
    }

    function pause() external onlyAdmin {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyAdmin {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    // ============ View Functions ============

    function getProcessingBatchCollections(
        uint256 _batchId
    ) external view returns (uint256[] memory) {
        return processingBatches[_batchId].collectionIds;
    }

    function getUserStats(
        address _user
    )
        external
        view
        returns (
            uint256[4] memory collected,
            uint256[4] memory processed,
            uint256 totalEarnings,
            uint256 reputationScore
        )
    {
        UserProfile storage profile = userProfiles[_user];

        for (uint i = 0; i < 4; i++) {
            collected[i] = profile.totalCollected[AfricycleLibrary.WasteStream(i)];
            processed[i] = profile.totalProcessed[AfricycleLibrary.WasteStream(i)];
        }

        return (
            collected,
            processed,
            profile.totalEarnings,
            profile.reputationScore
        );
    }

    // ============ Additional User Management Functions ============

    function updateUserProfile(
        string memory _name,
        string memory _location,
        string memory _contactInfo
    ) external whenNotPaused notSuspended notBlacklisted canUpdateProfile {
        require(userProfiles[msg.sender].registrationDate > 0, 'Not registered');
        require(bytes(_name).length > 0, 'Name required');
        require(bytes(_location).length > 0, 'Location required');

        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.location = _location;
        profile.contactInfo = _contactInfo;
        lastProfileUpdate[msg.sender] = block.timestamp;

        emit UserProfileUpdated(msg.sender, _name, _location);
    }

    function updateUserReputation(
        address _user,
        uint256 _newScore
    ) external onlyAdmin {
        require(_newScore <= 1000, 'Score too high'); // Max 1000 points
        userProfiles[_user].reputationScore = _newScore;
        emit UserReputationUpdated(_user, _newScore);
    }

    // ============ Impact Credit Management ============

    function transferImpactCredit(
        uint256 _creditId,
        address _to
    ) external whenNotPaused {
        require(_to != address(0), 'Invalid address');
        ImpactCredit storage credit = impactCredits[_creditId];
        require(credit.owner == msg.sender, 'Not owner');

        credit.owner = _to;
        emit ImpactCreditTransferred(_creditId, msg.sender, _to);
    }

    function verifyImpactCredit(
        uint256 _creditId,
        string memory _verificationProof
    ) external onlyVerifier whenNotPaused {
        require(bytes(_verificationProof).length > 0, 'Proof required');
        ImpactCredit storage credit = impactCredits[_creditId];
        credit.verificationProof = _verificationProof;
        emit ImpactCreditVerified(_creditId, msg.sender, _verificationProof);
    }

    function burnImpactCredit(uint256 _creditId) external whenNotPaused {
        ImpactCredit storage credit = impactCredits[_creditId];
        require(credit.owner == msg.sender, 'Not owner');
        delete impactCredits[_creditId];
        emit ImpactCreditBurned(_creditId, msg.sender);
    }

    // ============ Processing Management ============

    function updateProcessingBatch(
        uint256 _batchId,
        uint256 _newOutputAmount,
        AfricycleLibrary.QualityGrade _newQuality
    ) external onlyRecycler whenNotPaused {
        ProcessingBatch storage batch = processingBatches[_batchId];
        require(batch.processor == msg.sender, 'Not processor');
        require(batch.status == Status.IN_PROGRESS, 'Not in progress');
        require(_newOutputAmount <= batch.inputAmount, 'Invalid amount');

        batch.outputAmount = _newOutputAmount;
        batch.outputQuality = _newQuality;

        emit ProcessingBatchUpdated(_batchId, _newOutputAmount, _newQuality);
    }

    function rejectProcessingBatch(
        uint256 _batchId,
        string memory _reason
    ) external onlyVerifier whenNotPaused {
        ProcessingBatch storage batch = processingBatches[_batchId];
        require(batch.status == Status.IN_PROGRESS, 'Not in progress');

        batch.status = Status.REJECTED;
        emit ProcessingRejected(_batchId, _reason);
    }

    // ============ Marketplace Management ============

    function updateListing(
        uint256 _listingId,
        uint256 _newAmount,
        uint256 _newPrice
    ) public onlyRecycler whenNotPaused {
        MarketplaceListing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, 'Not seller');
        require(listing.isActive, 'Not active');
        require(_newAmount > 0, 'Invalid amount');
        require(_newPrice > 0, 'Invalid price');

        listing.amount = _newAmount;
        listing.pricePerUnit = _newPrice;

        emit ListingUpdated(_listingId, _newAmount, _newPrice, listing.isActive);
    }

    function cancelListing(uint256 _listingId) external whenNotPaused {
        MarketplaceListing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, 'Not seller');
        require(listing.isActive, 'Not active');

        listing.isActive = false;
        userActiveListings[msg.sender]--;

        emit ListingCancelled(_listingId, msg.sender);
    }

    // ============ Emergency Functions ============

    function emergencyWithdraw(
        address _token,
        uint256 _amount
    ) external onlyAdmin whenPaused {
        require(_token != address(0), 'Invalid token');
        require(_amount > 0, 'Amount must be positive');
        require(
            IERC20(_token).balanceOf(address(this)) >= _amount,
            'Insufficient balance'
        );

        require(IERC20(_token).transfer(msg.sender, _amount), 'Transfer failed');

        emit EmergencyWithdrawal(msg.sender, _token, _amount);
    }

    // ============ Withdrawal Functions ============

    /**
     * @notice Allows collectors to withdraw their earnings
     * @param _amount Amount to withdraw
     */
    function withdrawCollectorEarnings(uint256 _amount) external onlyCollector whenNotPaused notSuspended notBlacklisted {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalEarnings >= _amount, 'Insufficient earnings');
        require(_amount > 0, 'Amount must be positive');
        
        profile.totalEarnings -= _amount;
        require(cUSDToken.transfer(msg.sender, _amount), 'Transfer failed');
        
        emit RewardPaid(msg.sender, _amount, AfricycleLibrary.WasteStream.GENERAL, 0);
    }

    /**
     * @notice Allows recyclers to withdraw their earnings
     * @param _amount Amount to withdraw
     */
    function withdrawRecyclerEarnings(uint256 _amount) external onlyRecycler whenNotPaused notSuspended notBlacklisted {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalEarnings >= _amount, 'Insufficient earnings');
        require(_amount > 0, 'Amount must be positive');
        
        profile.totalEarnings -= _amount;
        require(cUSDToken.transfer(msg.sender, _amount), 'Transfer failed');
        
        emit RewardPaid(msg.sender, _amount, AfricycleLibrary.WasteStream.GENERAL, 0);
    }

    /**
     * @notice Allows corporate partners to withdraw their earnings
     * @param _amount Amount to withdraw
     */
    function withdrawCorporateEarnings(uint256 _amount) external onlyCorporate whenNotPaused notSuspended notBlacklisted {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalEarnings >= _amount, 'Insufficient earnings');
        require(_amount > 0, 'Amount must be positive');
        
        profile.totalEarnings -= _amount;
        require(cUSDToken.transfer(msg.sender, _amount), 'Transfer failed');
        
        emit RewardPaid(msg.sender, _amount, AfricycleLibrary.WasteStream.GENERAL, 0);
    }

    /**
     * @notice Allows collection points to withdraw their earnings
     * @param _amount Amount to withdraw
     */
    function withdrawCollectionPointEarnings(uint256 _amount) external onlyCollectionPoint whenNotPaused notSuspended notBlacklisted {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.totalEarnings >= _amount, 'Insufficient earnings');
        require(_amount > 0, 'Amount must be positive');
        
        profile.totalEarnings -= _amount;
        require(cUSDToken.transfer(msg.sender, _amount), 'Transfer failed');
        
        emit RewardPaid(msg.sender, _amount, AfricycleLibrary.WasteStream.GENERAL, 0);
    }

    // ============ Additional View Functions ============

    function getCollectionDetails(
        uint256 _collectionId
    )
        external
        view
        returns (
            WasteCollection memory collection,
            uint256[] memory componentCounts,
            string memory serialNumber,
            string memory manufacturer,
            uint256 estimatedValue
        )
    {
        collection = collections[_collectionId];
        if (collection.wasteType == AfricycleLibrary.WasteStream.EWASTE) {
            EWasteDetails storage details = eWasteDetails[_collectionId];
            componentCounts = new uint256[](4);
            for (uint i = 0; i < 4; i++) {
                componentCounts[i] = details.components[EWasteComponent(i)];
            }
            serialNumber = details.serialNumber;
            manufacturer = details.manufacturer;
            estimatedValue = details.estimatedValue;
        }
    }

    function getProcessingBatchDetails(
        uint256 _batchId
    )
        external
        view
        returns (
            ProcessingBatch memory batch,
            address processor,
            uint256[] memory collectionIds
        )
    {
        batch = processingBatches[_batchId];
        processor = batch.processor;
        collectionIds = batch.collectionIds;
    }

    function getMarketplaceListings(
        AfricycleLibrary.WasteStream _wasteType,
        bool _activeOnly
    ) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (
                listings[i].wasteType == _wasteType &&
                (!_activeOnly || listings[i].isActive)
            ) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _listingIdCounter; i++) {
            if (
                listings[i].wasteType == _wasteType &&
                (!_activeOnly || listings[i].isActive)
            ) {
                result[index++] = i;
            }
        }
        return result;
    }

    function getUserImpactCredits(
        address _user
    ) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _impactCreditIdCounter; i++) {
            if (impactCredits[i].owner == _user) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _impactCreditIdCounter; i++) {
            if (impactCredits[i].owner == _user) {
                result[index++] = i;
            }
        }
        return result;
    }

    function getContractStats()
        external
        view
        returns (
            uint256[4] memory collectedStats,
            uint256[4] memory processedStats,
            uint256 userCount,
            uint256 listingCount,
            uint256 creditCount
        )
    {
        listingCount = _listingIdCounter;
        creditCount = _impactCreditIdCounter;

        for (uint i = 0; i < 4; i++) {
            processedStats[i] = totalProcessed[AfricycleLibrary.WasteStream(i)];
        }

        return (
            collectedStats,
            processedStats,
            userCount,
            listingCount,
            creditCount
        );
    }

    function getUserDetailedStats(
        address _user
    )
        external
        view
        returns (UserStats memory)
    {
        UserProfile storage profile = userProfiles[_user];
        UserStats memory stats;
        
        for (uint i = 0; i < 4; i++) {
            stats.collected[i] = profile.totalCollected[AfricycleLibrary.WasteStream(i)];
            stats.processed[i] = profile.totalProcessed[AfricycleLibrary.WasteStream(i)];
        }

        stats.totalEarnings = profile.totalEarnings;
        stats.reputationScore = profile.reputationScore;
        stats.activeListings = userActiveListings[_user];
        stats.verifiedStatus = profile.isVerified;
        stats.suspendedStatus = isSuspended[_user];
        stats.blacklistedStatus = isBlacklisted[_user];
        
        return stats;
    }

    function getPlatformStats()
        external
        view
        returns (
            uint256 userCount,
            uint256 collectionCount,
            uint256 processedCount,
            uint256 listingCount,
            uint256 creditCount,
            uint256 revenue,
            uint256[4] memory wasteStats
        )
    {
        userCount = _collectionIdCounter;
        collectionCount = _collectionIdCounter;
        processedCount = _processingIdCounter;
        listingCount = _listingIdCounter;
        creditCount = _impactCreditIdCounter;
        revenue = cUSDToken.balanceOf(address(this));

        for (uint i = 0; i < 4; i++) {
            wasteStats[i] = totalProcessed[AfricycleLibrary.WasteStream(i)];
        }

        return (
            userCount,
            collectionCount,
            processedCount,
            listingCount,
            creditCount,
            revenue,
            wasteStats
        );
    }

    // ============ Additional Functions ============

    /**
     * @notice Suspends a user from the platform
     * @param _user Address of user to suspend
     * @param _reason Reason for suspension
     */
    function suspendUser(
        address _user,
        string memory _reason
    ) external onlyAdmin {
        require(!isSuspended[_user], 'Already suspended');
        isSuspended[_user] = true;
        emit UserSuspended(_user, _reason);
    }

    /**
     * @notice Unsuspends a user
     * @param _user Address of user to unsuspend
     */
    function unsuspendUser(address _user) external onlyAdmin {
        require(isSuspended[_user], 'Not suspended');
        isSuspended[_user] = false;
        emit UserUnsuspended(_user);
    }

    /**
     * @notice Blacklists a user
     * @param _user Address of user to blacklist
     * @param _reason Reason for blacklisting
     */
    function blacklistUser(
        address _user,
        string memory _reason
    ) external onlyAdmin {
        require(!isBlacklisted[_user], 'Already blacklisted');
        isBlacklisted[_user] = true;
        emit UserBlacklisted(_user, _reason);
    }

    /**
     * @notice Removes a user from blacklist
     * @param _user Address of user to remove
     */
    function removeFromBlacklist(address _user) external onlyAdmin {
        require(isBlacklisted[_user], 'Not blacklisted');
        isBlacklisted[_user] = false;
        emit UserRemovedFromBlacklist(_user);
    }

    /**
     * @notice Sets verification threshold for a waste type
     * @param _wasteType Type of waste
     * @param _threshold New threshold value
     */
    function setVerificationThreshold(
        AfricycleLibrary.WasteStream _wasteType,
        uint256 _threshold
    ) external onlyAdmin {
        verificationThresholds[_wasteType] = _threshold;
        emit VerificationThresholdUpdated(_wasteType, _threshold);
    }

    function _validateWasteStream(AfricycleLibrary.WasteStream _stream) internal pure returns (bool) {
        return true;
    }

    function _calculateCarbonOffset(uint256 _amount) internal pure returns (uint256) {
        return 0;
    }

    function _getRewardAmount(
        AfricycleLibrary.WasteStream wasteType,
        uint256 weight,
        AfricycleLibrary.QualityGrade quality
    ) internal view returns (uint256) {
        uint256 basePrice = wasteType == AfricycleLibrary.WasteStream.PLASTIC ? 100 : 50;
        uint256 qualityMultiplier = uint256(quality) + 1;
        return (basePrice * weight * qualityMultiplier) / 10;
    }
}
