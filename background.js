let config = {
  contentFiltering: true,
  screenTimeLimit: 120,
  parentalPassword: "",
  blockedSites: [
    "adult-site-example.com",
    "gambling-example.com", 
    "violence-example.com",
    "pornhub.com",
    "xvideos.com",
    "xnxx.com",
    "youporn.com",
    "redtube.com"
  ],
  keywordFiltering: true,
  keywords: [
    "adult content", "gambling", "drugs", "violence", 
    "porn", "xxx", "sex video", "nudity", "naked", 
    "explicit content", "adult video", "adult film",
    "nsfw", "adult images", "18+", "adult only"
  ],
  blockExplicitSearches: true,
  searchEngines: {
    "google.com": {
      queryParam: "q",
      resultSelector: ".g"
    },
    "bing.com": {
      queryParam: "q",
      resultSelector: ".b_algo"
    },
    "yahoo.com": {
      queryParam: "p",
      resultSelector: ".algo"
    },
    "duckduckgo.com": {
      queryParam: "q",
      resultSelector: ".result"
    },
    "yandex.com": {
      queryParam: "text",
      resultSelector: ".serp-item"
    }
  }
};

let blockedContentHistory = [];
const MAX_HISTORY_ITEMS = 50;

let stats = {
  sitesBlockedCount: 0,
  contentFilteredCount: 0
};

function loadConfig() {
  try {
    chrome.storage.sync.get(['safesphereConfig', 'blockedContentHistory'], function(data) {
      if (chrome.runtime.lastError) {
        console.error("Error loading config:", chrome.runtime.lastError);
        return;
      }
      
      if (data.safesphereConfig) {
        config = data.safesphereConfig;
      } else {
        saveConfig(config);
      }
      
      if (data.blockedContentHistory) {
        blockedContentHistory = data.blockedContentHistory;
      }
    });
  } catch (error) {
    console.error("Critical error loading config:", error);
  }
}

function saveConfig(configData) {
  try {
    chrome.storage.sync.set({ 
      'safesphereConfig': configData,
      'blockedContentHistory': blockedContentHistory 
    }, function() {
      if (chrome.runtime.lastError) {
        console.error("Error saving config:", chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error("Critical error saving config:", error);
  }
}

loadConfig();

let screenTimeStart = Date.now();
let todayScreenTime = 0;

chrome.webNavigation.onBeforeNavigate.addListener(details => {
  try {
    if (details.frameId !== 0) return; // Only check main frame
    
    const url = new URL(details.url);
    
    if (config.blockedSites.some(site => url.hostname.includes(site))) {
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL("blocked.html?reason=blockedsite")
      });
      return;
    }
    
    if (config.blockExplicitSearches) {
      const searchEngine = Object.keys(config.searchEngines).find(domain => 
        url.hostname.includes(domain) || url.hostname.includes(`www.${domain}`)
      );
      
      if (searchEngine) {
        const queryParam = config.searchEngines[searchEngine].queryParam;
        const searchQuery = url.searchParams.get(queryParam);
        
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          
          const hasExplicitTerms = config.keywords.some(keyword => 
            lowerQuery.includes(keyword.toLowerCase())
          );
          
          if (hasExplicitTerms) {
            chrome.tabs.update(details.tabId, {
              url: chrome.runtime.getURL("blocked.html?reason=explicitsearch&query=" + encodeURIComponent(searchQuery))
            });
            return;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in URL checking:", error);
  }
});

try {
  chrome.alarms.create("screenTimeCheck", { periodInMinutes: 1 });
} catch (error) {
  console.error("Error creating alarm:", error);
}

chrome.alarms.onAlarm.addListener(alarm => {
  try {
    if (alarm.name === "screenTimeCheck") {
      todayScreenTime += 1;
      
      if (config.screenTimeLimit > 0 && todayScreenTime >= config.screenTimeLimit) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "assets/icons/icon128.png",
          title: "Screen Time Limit Reached",
          message: "You've reached your daily screen time limit. Take a break!"
        });
      }
    }
  } catch (error) {
    console.error("Error in alarm handling:", error);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "getConfig") {
      sendResponse({config: config});
    } else if (request.action === "updateConfig") {
      config = request.config;
      saveConfig(config);
      sendResponse({success: true});
    } else if (request.action === "getScreenTime") {
      sendResponse({screenTime: todayScreenTime});
    } else if (request.action === "updateFilteredCount") {
      stats.contentFilteredCount += request.count;
      sendResponse({success: true});
    } else if (request.action === "getStats") {
      sendResponse({stats: stats});
    } else if (request.action === "logBlockedContent") {
      blockedContentHistory.unshift(request.blockedInfo);
      if (blockedContentHistory.length > MAX_HISTORY_ITEMS) {
        blockedContentHistory = blockedContentHistory.slice(0, MAX_HISTORY_ITEMS);
      }
      stats.sitesBlockedCount++;
      sendResponse({success: true});
    } else if (request.action === "getBlockedContentHistory") {
      sendResponse({history: blockedContentHistory});
    } else if (request.action === "requestAccess") {
      console.log("Access requested for:", request.contentInfo);
      sendResponse({success: true});
    }
  } catch (error) {
    console.error("Error handling message:", error);
    sendResponse({error: error.message});
  }
  return true;
});

function resetStats() {
  try {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      todayScreenTime = 0;
      stats.sitesBlockedCount = 0;
      stats.contentFilteredCount = 0;
    }
  } catch (error) {
    console.error("Error resetting stats:", error);
  }
}

setInterval(resetStats, 60000);
