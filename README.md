# SafeSphere: Teen Online Protection Extension

SafeSphere is a browser extension developed by Aryx that provides comprehensive online protection for teenagers. It uses advanced content filtering and time management tools to create a safer browsing experience without being overly restrictive.

## About

SafeSphere was created to address the growing concern of inappropriate content exposure to teens online. The extension works by analyzing web page content, filtering search results, and blocking access to known harmful websites, all while providing parents with oversight tools.

## Current Features

- **Content Filtering**: Automatically detects and masks inappropriate content including text and images
- **Search Engine Protection**: Blocks explicit search queries and filters search results
- **Website Blocking**: Prevents access to websites containing harmful content with customizable blocklists
- **Screen Time Management**: Helps teens develop healthy digital habits with configurable time limits
- **Parental Controls**: Password-protected settings that allow parents to customize protection levels
- **Usage Statistics**: Tracks screen time and protection activity for better monitoring
- **Safety Tips**: Provides daily online safety tips to educate teens about internet safety
- **Context Invalidation Recovery**: Automatically recovers from extension reloads and browser restarts

## Future Improvements

- **AI-powered Content Analysis**: Implement machine learning to better identify inappropriate content
- **Cross-browser Support**: Expand compatibility to Firefox, Safari, and other browsers
- **Mobile Device Integration**: Create companion apps for mobile protection
- **Detailed Reporting**: Enhanced weekly/monthly reports for parents
- **Custom Filter Categories**: Allow more granular control over what content is filtered
- **Multi-user Profiles**: Support for families with multiple children
- **Remote Management**: Allow parents to adjust settings remotely
- **Educational Resources**: Built-in guides and resources about online safety

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the SafeSphere directory
5. The extension should now be installed and active

## Usage

- Click the SafeSphere icon in your browser toolbar to see protection status and screen time
- Use the Settings page to configure filtering options, blocked sites, and screen time limits
- Parents can set a password to prevent unauthorized changes to protection settings
- The extension works automatically in the background to filter content and enforce limits

## Technology

SafeSphere is built using:
- JavaScript
- Chrome Extension API
- HTML/CSS
- Font Awesome for icons
- Manifest V3 for modern extension architecture

## File Structure

- `manifest.json`: Extension configuration
- `background.js`: Core background functionality
- `content.js`: Content filtering script that runs on web pages
- `popup/`: Contains the toolbar popup UI
- `options/`: Contains the settings page
- `assets/`: Icons and other resources

## Notes for Parents

- Set up the parental password immediately after installation
- Review the default blocked sites and keywords to customize for your teen
- Regularly check the screen time statistics to ensure healthy online habits

## Development

To make changes to the extension:

1. Modify the files as needed
2. Save your changes
3. Go to the extensions page in Chrome (`chrome://extensions/`)
4. Click the refresh icon on the SafeSphere extension card
5. Your changes will be applied immediately

## Created By

SafeSphere was developed by Aryx with a focus on balancing effective protection with respect for teens' autonomy and privacy.

---

© 2023 Aryx. All rights reserved.
