# Changelog

## [2025-01-10] - Critical Calculation Fixes and Enhanced Card UI

### Fixed
- **String Concatenation Bug**: Fixed critical issue where current balance and pending balance were being concatenated as strings instead of added as numbers
  - Added explicit Number() conversion for all balance calculations
  - Fixed "Used" amount showing incorrect values like ₹3136064549
  - Ensured proper mathematical operations instead of string concatenation

- **RangeError in CardDetail**: Fixed critical RangeError caused by negative values in string repeat() function
  - Added proper bounds checking for usage percentage calculations
  - Ensured all repeat() calls use non-negative values with Math.max(0, value)
  - Fixed usage calculation logic to prevent invalid percentages

- **Date Display Issue**: Fixed "Last Updated" showing as "0/0/0005"
  - Added validation to check for invalid date values
  - Shows "Never" for invalid or placeholder dates

### Enhanced
- **Card Visual Design**: Completely redesigned card detail view to look like actual credit cards
  - Added ASCII art card representation with proper formatting
  - Implemented visual progress bars for credit usage (30 characters wide)
  - Added color-coded usage indicators (🟢 Low, 🟡 Moderate, 🔴 High usage)
  - Enhanced spending insights with contextual alerts and recommendations

### Improved
- **Usage Calculation**: Fixed and improved credit card usage percentage calculations
  - Added proper validation for totalLimit > 0 before calculations
  - Implemented bounds checking to ensure percentages stay within 0-100%
  - Enhanced progress bar visualization with better visual feedback
  - Added spending insights based on usage levels
  - Fixed EMI transaction handling - now shows note when available balance differs from calculated value

### Technical Details
- All usage calculations now use Math.min(100, Math.max(0, percentage)) for safety
- Progress bars use proper bounds checking to prevent negative repeat values
- Enhanced error handling for edge cases in card data
- Improved visual hierarchy with better markdown formatting

## [2025-01-10] - Card Addition and Bank Logo Implementation

### Fixed
- **Card Form Submission Issue**: Fixed the issue where newly added cards weren't appearing in the UI after form submission
  - Added proper card saving logic in `CardForm` component using `addCard` and `editCard` functions from utils
  - Fixed async/await handling in `index.tsx` to ensure cards are loaded before navigation pop
  - Added proper number parsing for numeric fields (cardLimit, weeklySpending, etc.)

### Added
- **Bank Logo Support**: Implemented bank logos for all supported banks
  - Created `bank-logos.json` with logo URLs and color schemes for:
    - ICICI Bank
    - Kotak Mahindra Bank
    - IDFC First Bank
    - Federal Bank
    - Axis Bank
    - HDFC Bank
    - Bajaj Finance
  - Added new type definitions (`BankInfo`, `BankLogos`) to support bank information
  - Implemented `getBankIcon` function to retrieve bank logos dynamically
  - Updated UI to display bank logos instead of generic credit card icons

### Changed
- **Bank Selection in Form**: Replaced text field with dropdown for bank selection
  - Users now select banks from a predefined list ensuring consistency with logos
  - Dropdown shows full bank names while storing the short key
  - Maintains compatibility with existing cards

### Technical Details
- Bank logos are fetched from public CDN sources
- Logos are displayed with rounded rectangle mask for consistent appearance
- Fallback to generic credit card icon if bank logo is not found
- All changes maintain backward compatibility with existing card data
