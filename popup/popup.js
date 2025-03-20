document.addEventListener('DOMContentLoaded', function() {
  const protectionStatus = document.getElementById('protection-status');
  const statusIcon = document.getElementById('status-icon');
  const statusCircle = document.querySelector('.status-circle');
  const screenTimeElement = document.getElementById('screen-time');
  const filteredContentElement = document.getElementById('filtered-content');
  const pauseButton = document.getElementById('pause-button');
  const settingsButton = document.getElementById('settings-button');
  const dailyTip = document.getElementById('daily-tip');
  
  function loadConfig() {
    try {
      chrome.runtime.sendMessage({action: "getConfig"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error loading config:", chrome.runtime.lastError);
          protectionStatus.textContent = "Error";
          protectionStatus.style.backgroundColor = "#dc3545";
          return;
        }
        
        const config = response.config;
        
        if (config.contentFiltering) {
          protectionStatus.textContent = "Active";
          protectionStatus.className = "badge active";
          statusCircle.classList.add('active');
          statusCircle.style.backgroundColor = '#48cae4';
          statusIcon.className = 'fas fa-shield-alt';
        } else {
          protectionStatus.textContent = "Paused";
          protectionStatus.className = "badge paused";
          statusCircle.classList.remove('active');
          statusCircle.style.backgroundColor = '#f72585';
          statusIcon.className = 'fas fa-pause';
        }
      });
    } catch (error) {
      console.error("Critical error loading config:", error);
      protectionStatus.textContent = "Error";
      protectionStatus.style.backgroundColor = "#dc3545";
    }
  }
  
  function loadScreenTime() {
    try {
      chrome.runtime.sendMessage({action: "getScreenTime"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error loading screen time:", chrome.runtime.lastError);
          screenTimeElement.textContent = "Error";
          return;
        }
        
        const minutes = response.screenTime;
        if (minutes < 60) {
          screenTimeElement.textContent = `${minutes}m`;
        } else {
          const hours = Math.floor(minutes / 60);
          const remainingMinutes = minutes % 60;
          screenTimeElement.textContent = `${hours}h ${remainingMinutes}m`;
        }
      });
      
      chrome.runtime.sendMessage({action: "getStats"}, function(response) {
        if (chrome.runtime.lastError || !response.stats) {
          console.error("Error loading stats:", chrome.runtime.lastError);
          return;
        }
        
        filteredContentElement.textContent = response.stats.contentFilteredCount || '0';
      });
    } catch (error) {
      console.error("Critical error loading stats:", error);
    }
  }
  
  function loadBlockedContentHistory() {
    try {
      chrome.runtime.sendMessage({action: "getBlockedContentHistory"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error loading blocked content history:", chrome.runtime.lastError);
          return;
        }
        
        if (response.history && response.history.length > 0) {
          document.getElementById('blocked-content-section').style.display = 'block';
          
          const historyList = document.getElementById('blocked-content-list');
          historyList.innerHTML = '';
          
          const recentItems = response.history.slice(0, 5);
          recentItems.forEach(item => {
            const li = document.createElement('li');
            
            const date = new Date(item.timestamp);
            const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            if (item.reason === 'explicitsearch') {
              li.innerHTML = `<span class="time">${timeString}</span> Search: <span class="term">${item.query}</span>`;
            } else {
              let domain;
              try {
                domain = new URL(item.url).hostname;
              } catch (e) {
                domain = item.url;
              }
              li.innerHTML = `<span class="time">${timeString}</span> Site: <span class="term">${domain}</span>`;
            }
            
            historyList.appendChild(li);
          });
        }
      });
    } catch (error) {
      console.error("Error loading blocked content:", error);
    }
  }
  
  loadConfig();
  loadScreenTime();
  loadBlockedContentHistory();
  
  pauseButton.addEventListener('click', function() {
    try {
      chrome.runtime.sendMessage({action: "getConfig"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error("Error getting config for pause:", chrome.runtime.lastError);
          return;
        }
        
        const config = response.config;
        config.contentFiltering = !config.contentFiltering;
        
        chrome.runtime.sendMessage({
          action: "updateConfig", 
          config: config
        }, function(updateResponse) {
          if (chrome.runtime.lastError) {
            console.error("Error updating config:", chrome.runtime.lastError);
            return;
          }
          
          if (config.contentFiltering) {
            protectionStatus.textContent = "Active";
            protectionStatus.className = "badge active";
            statusCircle.classList.add('active');
            statusCircle.style.backgroundColor = '#48cae4';
            statusIcon.className = 'fas fa-shield-alt';
            pauseButton.innerHTML = '<i class="fas fa-pause"></i><span>Pause (15m)</span>';
          } else {
            protectionStatus.textContent = "Paused";
            protectionStatus.className = "badge paused";
            statusCircle.classList.remove('active');
            statusCircle.style.backgroundColor = '#f72585';
            statusIcon.className = 'fas fa-pause';
            pauseButton.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
            
            setTimeout(() => {
              try {
                chrome.runtime.sendMessage({action: "getConfig"}, function(response) {
                  if (chrome.runtime.lastError) return;
                  
                  const configToUpdate = response.config;
                  configToUpdate.contentFiltering = true;
                  chrome.runtime.sendMessage({
                    action: "updateConfig", 
                    config: configToUpdate
                  });
                });
              } catch (error) {
                console.error("Error in auto-resume:", error);
              }
            }, 15 * 60 * 1000);
          }
        });
      });
    } catch (error) {
      console.error("Critical error toggling protection:", error);
    }
  });
  
  settingsButton.addEventListener('click', function() {
    try {
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error("Error opening options page:", error);
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });
  
  const safetyTips = [
    "Never share personal information with strangers online.",
    "Use strong, unique passwords for each website.",
    "Think before you post - once online, always online.",
    "Be careful about who you friend or follow online.",
    "Report cyberbullying to a trusted adult immediately.",
    "Don't click on suspicious links or download unknown files.",
    "Remember that not everything you read online is true.",
    "Keep your social media profiles private.",
    "Be respectful to others online - treat them as you want to be treated.",
    "Take regular breaks from screen time."
  ];
  
  try {
    const randomTip = safetyTips[Math.floor(Math.random() * safetyTips.length)];
    dailyTip.textContent = randomTip;
  } catch (error) {
    console.error("Error displaying safety tip:", error);
    dailyTip.textContent = "Stay safe online!";
  }
});
