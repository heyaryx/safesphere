// SafeSphere content script that runs on web pages

let config = null;
let filteredItemsCount = 0;
let isInitialized = false;
let lastInitAttempt = 0;
const MIN_RETRY_INTERVAL = 5000;

function isExtensionValid() {
  try {
    return !!chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

function safelySendMessage(message, callback = null) {
  if (!isExtensionValid()) {
    console.log("SafeSphere: Extension context invalid, can't send message");
    return false;
  }
  
  try {
    chrome.runtime.sendMessage(message, function(response) {
      if (chrome.runtime.lastError) {
        console.log("SafeSphere: Message sending failed: " + chrome.runtime.lastError.message);
        return;
      }
      
      if (callback && typeof callback === 'function') {
        callback(response);
      }
    });
    return true;
  } catch (error) {
    console.log("SafeSphere: Error sending message: " + error.message);
    return false;
  }
}

function initializeExtension() {
  const now = Date.now();
  if (now - lastInitAttempt < MIN_RETRY_INTERVAL) return;
  lastInitAttempt = now;
  
  if (!isExtensionValid()) {
    console.log("SafeSphere: Extension context invalid, can't initialize");
    return;
  }
  
  try {
    safelySendMessage({action: "getConfig"}, function(response) {
      if (!response) return;
      
      config = response.config;
      isInitialized = true;
      
      if (config && config.contentFiltering) {
        filterPageContent();
      }
    });
  } catch (error) {
    console.log("SafeSphere: Error initializing extension: " + error.message);
    
    setTimeout(function() {
      if (!isInitialized && isExtensionValid()) {
        initializeExtension();
      }
    }, MIN_RETRY_INTERVAL);
  }
}

function filterPageContent() {
  if (!isExtensionValid() || !config || !config.keywords || !config.keywordFiltering) return;
  
  try {
    let newlyFilteredCount = 0;
    
    const currentUrl = window.location.href;
    const isSearchPage = Object.keys(config.searchEngines || {}).some(domain => 
      currentUrl.includes(domain)
    );
    
    if (isSearchPage) {
      filterSearchResults();
    }
    
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const sensitiveWordRegexes = config.keywords.map(word => 
      new RegExp(`\\b${word}\\b`, 'gi')
    );
    
    let node;
    while (node = walker.nextNode()) {
      let content = node.textContent;
      let shouldReplace = false;
      
      sensitiveWordRegexes.forEach(regex => {
        if (regex.test(content)) {
          shouldReplace = true;
          content = content.replace(regex, "***");
        }
      });
      
      if (shouldReplace) {
        node.textContent = content;
        newlyFilteredCount++;
      }
    }
    
    blurPotentiallyInappropriateImages();
    
    if (newlyFilteredCount > 0) {
      safelySendMessage({
        action: "updateFilteredCount", 
        count: newlyFilteredCount
      });
    }
  } catch (error) {
    console.log("SafeSphere: Error scanning page content: " + error.message);
  }
}

function filterSearchResults() {
  if (!isExtensionValid() || !config) return;
  
  try {
    const currentDomain = window.location.hostname;
    let searchEngine = null;
    
    for (const domain in config.searchEngines) {
      if (currentDomain.includes(domain) || currentDomain.includes(`www.${domain}`)) {
        searchEngine = config.searchEngines[domain];
        break;
      }
    }
    
    if (!searchEngine) return;
    
    const resultSelector = searchEngine.resultSelector;
    const resultElements = document.querySelectorAll(resultSelector);
    
    resultElements.forEach(result => {
      const resultText = result.textContent.toLowerCase();
      
      const containsExplicit = config.keywords.some(keyword => 
        resultText.includes(keyword.toLowerCase())
      );
      
      if (containsExplicit) {
        result.style.filter = 'blur(10px)';
        result.style.opacity = '0.5';
        
        const warning = document.createElement('div');
        warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Potentially inappropriate content filtered';
        warning.style.position = 'absolute';
        warning.style.top = '0';
        warning.style.left = '0';
        warning.style.right = '0';
        warning.style.padding = '10px';
        warning.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        warning.style.color = 'white';
        warning.style.textAlign = 'center';
        warning.style.zIndex = '1000';
        warning.style.fontSize = '14px';
        warning.style.fontWeight = 'bold';
        
        result.style.position = 'relative';
        result.style.overflow = 'hidden';
        
        result.appendChild(warning);
        
        filteredItemsCount++;
      }
    });
    
    if (currentDomain.includes('google.com')) {
      filterGoogleAutocomplete();
    }
  } catch (error) {
    console.log("SafeSphere: Error filtering search results: " + error.message);
  }
}

function filterGoogleAutocomplete() {
  try {
    const suggestionElements = document.querySelectorAll('ul[role="listbox"] li');
    
    suggestionElements.forEach(suggestion => {
      const suggestionText = suggestion.textContent.toLowerCase();
      
      const containsExplicit = config.keywords.some(keyword => 
        suggestionText.includes(keyword.toLowerCase())
      );
      
      if (containsExplicit) {
        suggestion.style.display = 'none';
        filteredItemsCount++;
      }
    });
  } catch (error) {
    console.log("SafeSphere: Error filtering autocomplete: " + error.message);
  }
}

function blurPotentiallyInappropriateImages() {
  try {
    if (!config || !config.keywords) return;
    
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      if (img.width > 100 && img.height > 100) {
        const altText = img.alt || '';
        const surroundingText = img.parentElement ? img.parentElement.textContent : '';
        
        const potentiallyInappropriate = config.keywords.some(keyword => {
          return altText.toLowerCase().includes(keyword) || 
                 surroundingText.toLowerCase().includes(keyword);
        });
        
        if (potentiallyInappropriate) {
          img.style.filter = 'blur(10px)';
          img.style.border = '2px solid red';
          
          const warning = document.createElement('div');
          warning.textContent = 'Potentially inappropriate content';
          warning.style.position = 'absolute';
          warning.style.background = 'red';
          warning.style.color = 'white';
          warning.style.padding = '5px';
          warning.style.fontSize = '12px';
          
          if (img.parentElement) {
            img.parentElement.style.position = 'relative';
            img.parentElement.appendChild(warning);
          }
          
          newlyFilteredCount++;
        }
      }
    });
  } catch (error) {
    console.log("SafeSphere: Error processing images: " + error.message);
  }
}

function setupMutationObserver() {
  if (!isExtensionValid()) return;
  
  try {
    const observer = new MutationObserver(mutations => {
      try {
        if (!isExtensionValid()) return;
        
        if (config && config.contentFiltering) {
          const currentUrl = window.location.href;
          const isSearchPage = Object.keys(config.searchEngines || {}).some(domain => 
            currentUrl.includes(domain)
          );
          
          if (isSearchPage) {
            const hasNewSearchResults = mutations.some(mutation => {
              return Array.from(mutation.addedNodes).some(node => {
                return node.nodeType === 1 && node.matches && 
                       (node.matches('.g') || node.matches('.b_algo') || 
                        node.matches('.result') || node.matches('.algo') ||
                        node.matches('.serp-item'));
              });
            });
            
            if (hasNewSearchResults) {
              filterSearchResults();
            }
            
            if (currentUrl.includes('google.com')) {
              filterGoogleAutocomplete();
            }
          }
          
          filterPageContent();
        }
      } catch (error) {
        console.log("SafeSphere: Error in mutation observer: " + error.message);
      }
    });
    
    if (document.body) {
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body && isExtensionValid()) {
          observer.observe(document.body, { 
            childList: true, 
            subtree: true 
          });
        }
      });
    }
    
    window.addEventListener('focus', () => {
      if (isExtensionValid() && !isInitialized) {
        initializeExtension();
      }
    });
    
    setInterval(() => {
      if (isExtensionValid() && !isInitialized) {
        initializeExtension();
      }
    }, 30000);
    
  } catch (error) {
    console.log("SafeSphere: Error setting up observer: " + error.message);
  }
}

try {
  if (isExtensionValid()) {
    initializeExtension();
    setupMutationObserver();
  }
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isExtensionValid() && !isInitialized) {
      initializeExtension();
    }
  });
  
} catch (error) {
  console.log("SafeSphere: Critical initialization error: " + error.message);
}
