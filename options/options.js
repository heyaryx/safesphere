// SafeSphere options page functionality

document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation
  const navItems = document.querySelectorAll('.sidebar li');
  const sections = document.querySelectorAll('.settings-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const targetSection = this.getAttribute('data-section');
      
      // Update active class on nav items
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      // Show the correct section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetSection) {
          section.classList.add('active');
        }
      });
    });
  });
  
  // Toggle password visibility
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      confirmPasswordInput.setAttribute('type', type);
      this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
  }
  
  // Weekend time settings toggle
  const weekendToggle = document.getElementById('screen-time-weekends');
  const weekendSettings = document.querySelector('.weekend-settings');
  
  if (weekendToggle && weekendSettings) {
    weekendToggle.addEventListener('change', function() {
      weekendSettings.classList.toggle('hidden', !this.checked);
    });
  }
  
  // Schedule settings toggle
  const scheduleToggle = document.getElementById('schedule-enabled');
  const scheduleSettings = document.querySelector('.schedule-settings');
  
  if (scheduleToggle && scheduleSettings) {
    scheduleToggle.addEventListener('change', function() {
      scheduleSettings.classList.toggle('hidden', !this.checked);
    });
  }
  
  // Remove site buttons
  const removeSiteButtons = document.querySelectorAll('.remove-site');
  
  removeSiteButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.parentElement.remove();
    });
  });
  
  // Get form elements for config
  const setPasswordButton = document.getElementById('set-password');
  const contentFilteringToggle = document.getElementById('content-filtering-toggle');
  const keywordFilteringToggle = document.getElementById('keyword-filtering-toggle');
  const imageFilteringToggle = document.getElementById('image-filtering-toggle');
  const blockedKeywordsTextarea = document.getElementById('blocked-keywords');
  const blockedSitesTextarea = document.getElementById('blocked-sites');
  const allowedSitesTextarea = document.getElementById('allowed-sites');
  const screenTimeLimitInput = document.getElementById('screen-time-limit');
  const saveSettingsButton = document.getElementById('save-settings');
  const resetDefaultsButton = document.getElementById('reset-defaults');
  const statusMessage = document.getElementById('status-message');
  
  // Default configuration
  const defaultConfig = {
    contentFiltering: true,
    screenTimeLimit: 120, // in minutes
    parentalPassword: "",
    blockedSites: [
      "adult-site-example.com",
      "gambling-example.com",
      "violence-example.com"
    ],
    allowedSites: [],
    keywordFiltering: true,
    imageFiltering: true,
    keywords: ["adult content", "gambling", "drugs", "violence"],
    weekendScreenTimeLimit: 240,
    useWeekendLimits: false,
    scheduleEnabled: false,
    scheduleStart: "08:00",
    scheduleEnd: "20:00",
    parentEmail: ""
  };
  
  // Load current configuration
  loadSettings();
  
  // Set password with validation
  if (setPasswordButton) {
    setPasswordButton.addEventListener('click', function() {
      const password = passwordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();
      
      if (password === "") {
        showStatus('Please enter a password', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        showStatus('Passwords do not match', 'error');
        return;
      }
      
      try {
        chrome.runtime.sendMessage({action: "getConfig"}, function(response) {
          if (chrome.runtime.lastError) {
            showStatus('Error getting configuration', 'error');
            return;
          }
          
          const config = response.config;
          config.parentalPassword = password;
          
          chrome.runtime.sendMessage({
            action: "updateConfig", 
            config: config
          }, function() {
            if (chrome.runtime.lastError) {
              showStatus('Error saving password', 'error');
              return;
            }
            
            showStatus('Password set successfully', 'success');
            passwordInput.value = "";
            confirmPasswordInput.value = "";
          });
        });
      } catch (error) {
        console.error("Error setting password:", error);
        showStatus('Error setting password', 'error');
      }
    });
  }
  
  // Save all settings
  if (saveSettingsButton) {
    saveSettingsButton.addEventListener('mousedown', function() {
      this.style.transform = 'scale(0.98)';
    });
    
    saveSettingsButton.addEventListener('mouseup', function() {
      this.style.transform = '';
    });
    
    saveSettingsButton.addEventListener('click', function() {
      try {
        chrome.runtime.sendMessage({action: "getConfig"}, function(response) {
          if (chrome.runtime.lastError) {
            showStatus('Error getting configuration', 'error');
            return;
          }
          
          const config = response.config;
          
          // Check if password protection is enabled and verify password
          if (config.parentalPassword && !verifyPassword()) {
            return;
          }
          
          // Update configuration with all settings
          config.contentFiltering = contentFilteringToggle.checked;
          config.keywordFiltering = keywordFilteringToggle.checked;
          
          if (imageFilteringToggle) {
            config.imageFiltering = imageFilteringToggle.checked;
          }
          
          // Get keywords and clean them
          config.keywords = blockedKeywordsTextarea.value.split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword !== "");
          
          // Get blocked sites
          config.blockedSites = blockedSitesTextarea.value.split('\n')
            .map(site => site.trim())
            .filter(site => site !== "");
          
          // Get allowed sites if available
          if (allowedSitesTextarea) {
            config.allowedSites = allowedSitesTextarea.value.split('\n')
              .map(site => site.trim())
              .filter(site => site !== "");
          }
          
          // Get screen time settings
          config.screenTimeLimit = parseInt(screenTimeLimitInput.value, 10) || 120;
          
          // Get weekend settings if available
          if (document.getElementById('screen-time-weekends') && document.getElementById('weekend-time-limit')) {
            config.useWeekendLimits = document.getElementById('screen-time-weekends').checked;
            config.weekendScreenTimeLimit = parseInt(document.getElementById('weekend-time-limit').value, 10) || 240;
          }
          
          // Get schedule settings if available
          if (document.getElementById('schedule-enabled') && document.getElementById('access-start') && document.getElementById('access-end')) {
            config.scheduleEnabled = document.getElementById('schedule-enabled').checked;
            config.scheduleStart = document.getElementById('access-start').value;
            config.scheduleEnd = document.getElementById('access-end').value;
          }
          
          // Get parent email if available
          if (document.getElementById('parent-email')) {
            config.parentEmail = document.getElementById('parent-email').value.trim();
          }
          
          // Save configuration
          chrome.runtime.sendMessage({
            action: "updateConfig", 
            config: config
          }, function() {
            if (chrome.runtime.lastError) {
              showStatus('Error saving settings', 'error');
              return;
            }
            
            showStatus('Settings saved successfully', 'success');
            
            // Update blocked sites list
            updateBlockedSitesList(config.blockedSites);
          });
        });
      } catch (error) {
        console.error("Error saving settings:", error);
        showStatus('Error saving settings', 'error');
      }
    });
  }
  
  // Reset to defaults
  if (resetDefaultsButton) {
    resetDefaultsButton.addEventListener('click', function() {
      try {
        chrome.runtime.sendMessage({action: "getConfig"}, function(response) {
          if (chrome.runtime.lastError) {
            showStatus('Error getting configuration', 'error');
            return;
          }
          
          // Check if password protection is enabled and verify password
          if (response.config.parentalPassword && !verifyPassword()) {
            return;
          }
          
          // Confirm reset
          if (!confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
            return;
          }
          
          chrome.runtime.sendMessage({
            action: "updateConfig", 
            config: defaultConfig
          }, function() {
            if (chrome.runtime.lastError) {
              showStatus('Error resetting settings', 'error');
              return;
            }
            
            loadSettings();
            showStatus('Settings reset to defaults', 'success');
          });
        });
      } catch (error) {
        console.error("Error resetting settings:", error);
        showStatus('Error resetting settings', 'error');
      }
    });
  }
  
  // Load settings from storage
  function loadSettings() {
    try {
      chrome.runtime.sendMessage({action: "getConfig"}, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Error loading settings', 'error');
          return;
        }
        
        const config = response.config;
        
        // Set basic toggles
        if (contentFilteringToggle) contentFilteringToggle.checked = config.contentFiltering;
        if (keywordFilteringToggle) keywordFilteringToggle.checked = config.keywordFiltering;
        if (imageFilteringToggle) imageFilteringToggle.checked = config.imageFiltering !== undefined ? config.imageFiltering : true;
        
        // Set text areas
        if (blockedKeywordsTextarea) blockedKeywordsTextarea.value = config.keywords ? config.keywords.join(', ') : '';
        if (blockedSitesTextarea) blockedSitesTextarea.value = config.blockedSites ? config.blockedSites.join('\n') : '';
        if (allowedSitesTextarea) allowedSitesTextarea.value = config.allowedSites ? config.allowedSites.join('\n') : '';
        
        // Set screen time
        if (screenTimeLimitInput) screenTimeLimitInput.value = config.screenTimeLimit || 120;
        
        // Set weekend settings
        if (document.getElementById('screen-time-weekends')) {
          document.getElementById('screen-time-weekends').checked = config.useWeekendLimits || false;
          if (document.querySelector('.weekend-settings')) {
            document.querySelector('.weekend-settings').classList.toggle('hidden', !config.useWeekendLimits);
          }
        }
        
        if (document.getElementById('weekend-time-limit')) {
          document.getElementById('weekend-time-limit').value = config.weekendScreenTimeLimit || 240;
        }
        
        // Set schedule settings
        if (document.getElementById('schedule-enabled')) {
          document.getElementById('schedule-enabled').checked = config.scheduleEnabled || false;
          if (document.querySelector('.schedule-settings')) {
            document.querySelector('.schedule-settings').classList.toggle('hidden', !config.scheduleEnabled);
          }
        }
        
        if (document.getElementById('access-start')) {
          document.getElementById('access-start').value = config.scheduleStart || '08:00';
        }
        
        if (document.getElementById('access-end')) {
          document.getElementById('access-end').value = config.scheduleEnd || '20:00';
        }
        
        // Set parent email
        if (document.getElementById('parent-email')) {
          document.getElementById('parent-email').value = config.parentEmail || '';
        }
        
        // Update blocked sites list
        updateBlockedSitesList(config.blockedSites);
        
        // Update stats with placeholder data
        updateStatsDisplay();
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      showStatus('Error loading settings', 'error');
    }
  }
  
  // Update blocked sites list
  function updateBlockedSitesList(sites) {
    const listElement = document.getElementById('current-blocked-sites');
    if (!listElement) return;
    
    // Clear current list
    listElement.innerHTML = '';
    
    // Add each site to the list
    sites.forEach(site => {
      const li = document.createElement('li');
      li.textContent = site;
      
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-site';
      removeButton.innerHTML = '<i class="fas fa-times"></i>';
      removeButton.addEventListener('click', function() {
        li.remove();
        saveBlockedSitesList();
      });
      
      li.appendChild(removeButton);
      listElement.appendChild(li);
    });
  }
  
  // Save blocked sites list after removal
  function saveBlockedSitesList() {
    const listItems = document.querySelectorAll('#current-blocked-sites li');
    const sites = Array.from(listItems).map(item => item.textContent.trim());
    
    if (blockedSitesTextarea) {
      blockedSitesTextarea.value = sites.join('\n');
    }
  }
  
  // Update stats display (placeholder implementation)
  function updateStatsDisplay() {
    // In a real implementation, this would fetch actual usage statistics
    const screenTimeDisplay = document.querySelector('.stat-item:nth-child(1) .stat-value');
    const contentFilteredDisplay = document.querySelector('.stat-item:nth-child(2) .stat-value');
    const sitesBlockedDisplay = document.querySelector('.stat-item:nth-child(3) .stat-value');
    
    if (screenTimeDisplay) {
      chrome.runtime.sendMessage({action: "getScreenTime"}, function(response) {
        if (!chrome.runtime.lastError && response.screenTime) {
          const minutes = response.screenTime;
          if (minutes < 60) {
            screenTimeDisplay.textContent = `0h ${minutes}m`;
          } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            screenTimeDisplay.textContent = `${hours}h ${remainingMinutes}m`;
          }
        }
      });
    }
    
    if (contentFilteredDisplay) {
      contentFilteredDisplay.textContent = Math.floor(Math.random() * 100);
    }
    
    if (sitesBlockedDisplay) {
      sitesBlockedDisplay.textContent = Math.floor(Math.random() * 20);
    }
  }
  
  // Verify password
  function verifyPassword() {
    try {
      const enteredPassword = prompt("Please enter the parental password to change settings:");
      
      if (!enteredPassword) {
        return false;
      }
      
      let isValid = false;
      
      chrome.runtime.sendMessage({action: "getConfig"}, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Error verifying password', 'error');
          return false;
        }
        
        if (enteredPassword !== response.config.parentalPassword) {
          showStatus('Incorrect password', 'error');
          isValid = false;
        } else {
          isValid = true;
        }
      });
      
      return isValid;
    } catch (error) {
      console.error("Error in password verification:", error);
      return false;
    }
  }
  
  // Show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type; // 'success' or 'error'
    
    // Remove 'hidden' class
    statusMessage.classList.remove('hidden');
    
    // Add entrance animation
    statusMessage.animate([
      { opacity: 0, transform: 'translateY(-20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    });
    
    // Hide after 3 seconds with exit animation
    setTimeout(function() {
      statusMessage.animate([
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-20px)' }
      ], {
        duration: 300,
        easing: 'ease-in'
      }).onfinish = function() {
        statusMessage.classList.add('hidden');
      };
    }, 3000);
  }

  // Enhance checkbox styling
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const parent = checkbox.closest('.checkbox-item');
    if (parent) {
      parent.addEventListener('click', function(e) {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
          // Trigger change event
          checkbox.dispatchEvent(new Event('change'));
        }
      });
    }
  });

});
